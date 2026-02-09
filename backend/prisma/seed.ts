import { PrismaClient, TicketPriority, TicketStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const itUsers = await prisma.user.createMany({
    data: [
      { email: "it.lisa@example.com", name: "Lisa Vermeulen", role: "IT" },
      { email: "it.bram@example.com", name: "Bram Peeters", role: "IT" },
      { email: "it.sara@example.com", name: "Sara Jacobs", role: "IT" }
    ],
    skipDuplicates: true
  });

  const requester = await prisma.user.upsert({
    where: { email: "jana.devos@example.com" },
    update: {},
    create: { email: "jana.devos@example.com", name: "Jana De Vos", role: "USER" }
  });

  const existing = await prisma.ticket.count();
  if (existing > 0) return;

  const ticketNumber = 100;
  const ticket = await prisma.ticket.create({
    data: {
      number: ticketNumber,
      title: "Laptop start niet op",
      description: "Mijn laptop blijft hangen op het opstartscherm.",
      teamviewerId: "123456789",
      teamviewerPassword: "demo-pass",
      priority: TicketPriority.HIGH,
      status: TicketStatus.IN_BEHANDELING,
      requesterId: requester.id
    }
  });

  await prisma.activityLog.createMany({
    data: [
      {
        ticketId: ticket.id,
        type: "CREATED",
        metadata: { by: requester.email }
      },
      {
        ticketId: ticket.id,
        type: "STATUS_CHANGED",
        metadata: { from: "AANGEVRAAGD", to: "IN_BEHANDELING" }
      }
    ]
  });

  await prisma.message.createMany({
    data: [
      {
        ticketId: ticket.id,
        senderId: requester.id,
        senderRole: "USER",
        content: "Ik heb dit vanochtend gemeld."
      }
    ]
  });

  void itUsers;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
