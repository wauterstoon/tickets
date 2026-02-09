# IT Support Ticket System

Een full-stack webapplicatie voor het beheren van IT-supporttickets met realtime chat, bestandsuploads en een professioneel dashboard.

## Structuur
- `frontend/` — React + TypeScript (Vite) + TailwindCSS
- `backend/` — Node.js + Express (TypeScript) + Prisma + Socket.IO
- `uploads/` — lokale opslag voor bijlagen (dev)

## Vereisten
- Node.js 18+
- PostgreSQL

## Setup
### 1) Backend
```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Open daarna `http://localhost:5173`.

## Omgevingsvariabelen
`backend/.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/itsupport"
PORT=4000
CLIENT_URL="http://localhost:5173"
IT_ADMIN_EMAILS="it.lisa@example.com,it.bram@example.com,it.sara@example.com"
```

`frontend/.env` (optioneel):
```
VITE_API_URL="http://localhost:4000"
```

## Gebruik
### Ticket aanmaken
1. Ga naar `/create`.
2. Vul alle verplichte velden in en upload optioneel bijlagen.
3. Na verzenden verschijnt een ticketnummer (sequentieel).

### Mijn tickets
1. Ga naar `/my-tickets`.
2. Vul je e-mailadres in en laad je tickets.
3. Klik op een ticket voor detail en chat.

### IT dashboard
1. Ga naar `/it`.
2. Vul een e-mailadres in dat in `IT_ADMIN_EMAILS` staat.
3. Gebruik filters, zoek op ticketnummer en open een ticket.

### Chatten
- De chat is realtime via Socket.IO.
- Berichten worden direct in beide interfaces getoond.

## Datamodel (Prisma)
- User (id, email, name, role, createdAt)
- Ticket (id, number, title, description, teamviewerId, teamviewerPassword, priority, status, requesterId, assignedToId, createdAt, updatedAt)
- Attachment (id, ticketId, filename, originalName, mimeType, size, path, createdAt)
- Message (id, ticketId, senderId, senderRole, content, createdAt)
- ActivityLog (id, ticketId, type, metadata, createdAt)

## Belangrijke notities
- TeamViewer wachtwoorden worden niet gelogd en zijn afgeschermd in de UI.
- Bestandsuploads worden lokaal opgeslagen in `/uploads`.
- Autorisatie is e-mail gebaseerd (geen wachtwoord), klaar voor uitbreiding.
