import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PrismaClient, TicketPriority, TicketStatus } from "@prisma/client";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import sanitizeHtml from "sanitize-html";
import { createServer } from "http";
import { Server } from "socket.io";

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL ?? "http://localhost:5173" }
});

const uploadDir = path.resolve(process.cwd(), "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Bestandstype niet toegestaan"));
    }
  }
});

app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadDir));

const ticketCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  title: z.string().min(2),
  description: z.string().min(5),
  teamviewerId: z.string().min(3),
  teamviewerPassword: z.string().min(3),
  priority: z.nativeEnum(TicketPriority)
});

const messageSchema = z.object({
  email: z.string().email(),
  content: z.string().min(1)
});

const itUpdateSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  note: z.string().optional(),
  publicMessage: z.string().optional()
});

const sanitize = (value: string) =>
  sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();

const isItUser = (email?: string | null) => {
  if (!email) return false;
  const list = (process.env.IT_ADMIN_EMAILS ?? "").split(",").map((item) => item.trim());
  return list.includes(email);
};

const requireIt = (req: Request, res: Response, next: NextFunction) => {
  const email = req.header("x-user-email");
  if (!isItUser(email)) {
    return res.status(403).json({ message: "Niet bevoegd" });
  }
  return next();
};

const getNextTicketNumber = async () => {
  const result: Array<{ max: number | null }> = await prisma.$queryRaw`
    SELECT MAX(number) as max FROM "Ticket";
  `;
  const current = result[0]?.max ?? 0;
  return current + 1;
};

io.on("connection", (socket) => {
  socket.on("join", (ticketNumber: number) => {
    socket.join(`ticket-${ticketNumber}`);
  });
});

app.post("/api/tickets", upload.array("attachments", 10), async (req, res) => {
  try {
    const parsed = ticketCreateSchema.parse(req.body);
    const safeTitle = sanitize(parsed.title);
    const safeDescription = sanitize(parsed.description);

    const requester = await prisma.user.upsert({
      where: { email: parsed.email },
      update: { name: parsed.name },
      create: { email: parsed.email, name: parsed.name, role: "USER" }
    });

    const number = await getNextTicketNumber();

    const ticket = await prisma.ticket.create({
      data: {
        number,
        title: safeTitle,
        description: safeDescription,
        teamviewerId: parsed.teamviewerId,
        teamviewerPassword: parsed.teamviewerPassword,
        priority: parsed.priority,
        requesterId: requester.id
      }
    });

    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length > 0) {
      await prisma.attachment.createMany({
        data: files.map((file) => ({
          ticketId: ticket.id,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: `/uploads/${file.filename}`
        }))
      });

      await prisma.activityLog.create({
        data: {
          ticketId: ticket.id,
          type: "ATTACHMENT_ADDED",
          metadata: { count: files.length }
        }
      });
    }

    await prisma.activityLog.create({
      data: {
        ticketId: ticket.id,
        type: "CREATED",
        metadata: { by: requester.email }
      }
    });

    res.status(201).json({ ticketNumber: ticket.number });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validatiefout", errors: error.errors });
    }
    return res.status(500).json({ message: "Serverfout" });
  }
});

app.get("/api/tickets/my", async (req, res) => {
  const email = req.query.email?.toString();
  if (!email) return res.status(400).json({ message: "E-mail verplicht" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json([]);

  const tickets = await prisma.ticket.findMany({
    where: { requesterId: user.id },
    orderBy: { createdAt: "desc" },
    include: { assignedTo: true }
  });

  res.json(tickets);
});

app.get("/api/tickets/:number", async (req, res) => {
  const ticketNumber = Number(req.params.number);
  const email = req.query.email?.toString();
  if (!email) return res.status(400).json({ message: "E-mail verplicht" });

  const ticket = await prisma.ticket.findUnique({
    where: { number: ticketNumber },
    include: { requester: true, assignedTo: true, attachments: true, activityLogs: true }
  });

  if (!ticket) return res.status(404).json({ message: "Ticket niet gevonden" });

  const isIt = isItUser(email);
  if (!isIt && ticket.requester.email !== email) {
    return res.status(403).json({ message: "Niet bevoegd" });
  }

  res.json(ticket);
});

app.patch("/api/tickets/:number", requireIt, async (req, res) => {
  try {
    const parsed = itUpdateSchema.parse(req.body);
    const ticketNumber = Number(req.params.number);

    const ticket = await prisma.ticket.findUnique({ where: { number: ticketNumber } });
    if (!ticket) return res.status(404).json({ message: "Ticket niet gevonden" });

    const updates: { status?: TicketStatus; assignedToId?: string | null } = {};
    if (parsed.status) updates.status = parsed.status;
    if (parsed.assignedToId !== undefined) updates.assignedToId = parsed.assignedToId;

    const updated = await prisma.ticket.update({
      where: { number: ticketNumber },
      data: updates,
      include: { assignedTo: true }
    });

    if (parsed.status && parsed.status !== ticket.status) {
      await prisma.activityLog.create({
        data: {
          ticketId: ticket.id,
          type: "STATUS_CHANGED",
          metadata: { from: ticket.status, to: parsed.status }
        }
      });
    }

    if (parsed.assignedToId !== undefined) {
      await prisma.activityLog.create({
        data: {
          ticketId: ticket.id,
          type: "ASSIGNED",
          metadata: { assignedToId: parsed.assignedToId }
        }
      });
    }

    if (parsed.note) {
      await prisma.activityLog.create({
        data: {
          ticketId: ticket.id,
          type: "NOTE_ADDED",
          metadata: { note: sanitize(parsed.note) }
        }
      });
    }

    if (parsed.publicMessage) {
      const senderEmail = req.header("x-user-email") ?? "";
      const sender = await prisma.user.findUnique({ where: { email: senderEmail } });
      if (sender) {
        const message = await prisma.message.create({
          data: {
            ticketId: ticket.id,
            senderId: sender.id,
            senderRole: "IT",
            content: sanitize(parsed.publicMessage)
          }
        });

        await prisma.activityLog.create({
          data: {
            ticketId: ticket.id,
            type: "MESSAGE_ADDED",
            metadata: { senderRole: "IT" }
          }
        });

        io.to(`ticket-${ticket.number}`).emit("message", message);
      }
    }

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validatiefout", errors: error.errors });
    }
    return res.status(500).json({ message: "Serverfout" });
  }
});

app.post("/api/tickets/:number/messages", async (req, res) => {
  try {
    const ticketNumber = Number(req.params.number);
    const parsed = messageSchema.parse(req.body);
    const ticket = await prisma.ticket.findUnique({
      where: { number: ticketNumber },
      include: { requester: true }
    });

    if (!ticket) return res.status(404).json({ message: "Ticket niet gevonden" });

    const sender = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (!sender) return res.status(400).json({ message: "Onbekende gebruiker" });

    const isIt = isItUser(parsed.email);
    if (!isIt && ticket.requester.email !== parsed.email) {
      return res.status(403).json({ message: "Niet bevoegd" });
    }

    const message = await prisma.message.create({
      data: {
        ticketId: ticket.id,
        senderId: sender.id,
        senderRole: isIt ? "IT" : "USER",
        content: sanitize(parsed.content)
      }
    });

    await prisma.activityLog.create({
      data: {
        ticketId: ticket.id,
        type: "MESSAGE_ADDED",
        metadata: { senderRole: isIt ? "IT" : "USER" }
      }
    });

    io.to(`ticket-${ticket.number}`).emit("message", message);

    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validatiefout", errors: error.errors });
    }
    return res.status(500).json({ message: "Serverfout" });
  }
});

app.get("/api/tickets/:number/messages", async (req, res) => {
  const ticketNumber = Number(req.params.number);
  const email = req.query.email?.toString();
  if (!email) return res.status(400).json({ message: "E-mail verplicht" });

  const ticket = await prisma.ticket.findUnique({
    where: { number: ticketNumber },
    include: { requester: true }
  });

  if (!ticket) return res.status(404).json({ message: "Ticket niet gevonden" });

  const isIt = isItUser(email);
  if (!isIt && ticket.requester.email !== email) {
    return res.status(403).json({ message: "Niet bevoegd" });
  }

  const messages = await prisma.message.findMany({
    where: { ticketId: ticket.id },
    orderBy: { createdAt: "asc" },
    include: { sender: true }
  });

  res.json(messages);
});

app.post("/api/tickets/:number/attachments", upload.array("attachments", 10), async (req, res) => {
  const ticketNumber = Number(req.params.number);
  const email = req.query.email?.toString();
  if (!email) return res.status(400).json({ message: "E-mail verplicht" });

  const ticket = await prisma.ticket.findUnique({
    where: { number: ticketNumber },
    include: { requester: true }
  });

  if (!ticket) return res.status(404).json({ message: "Ticket niet gevonden" });

  const isIt = isItUser(email);
  if (!isIt && ticket.requester.email !== email) {
    return res.status(403).json({ message: "Niet bevoegd" });
  }

  const files = (req.files as Express.Multer.File[]) ?? [];
  if (!files.length) return res.status(400).json({ message: "Geen bestanden" });

  const attachments = await prisma.attachment.createMany({
    data: files.map((file) => ({
      ticketId: ticket.id,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`
    }))
  });

  await prisma.activityLog.create({
    data: {
      ticketId: ticket.id,
      type: "ATTACHMENT_ADDED",
      metadata: { count: files.length }
    }
  });

  res.status(201).json({ count: attachments.count });
});

app.get("/api/it/tickets", requireIt, async (req, res) => {
  const status = req.query.status?.toString();
  const priority = req.query.priority?.toString();
  const assigned = req.query.assigned?.toString();
  const sort = req.query.sort?.toString();

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigned === "assigned") where.assignedToId = { not: null };
  if (assigned === "unassigned") where.assignedToId = null;

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "priority"
      ? { priority: "desc" }
      : { createdAt: "desc" };

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy,
    include: { requester: true, assignedTo: true }
  });

  res.json(tickets);
});

app.get("/api/it/tickets/:number", requireIt, async (req, res) => {
  const ticketNumber = Number(req.params.number);
  const ticket = await prisma.ticket.findUnique({
    where: { number: ticketNumber },
    include: { requester: true, assignedTo: true, attachments: true, activityLogs: true }
  });

  if (!ticket) return res.status(404).json({ message: "Ticket niet gevonden" });

  const engineers = await prisma.user.findMany({ where: { role: "IT" } });

  res.json({ ticket, engineers });
});

app.get("/api/it/engineers", requireIt, async (_req, res) => {
  const engineers = await prisma.user.findMany({ where: { role: "IT" } });
  res.json(engineers);
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(400).json({ message: error.message ?? "Fout" });
});

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
