export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
}

export interface Ticket {
  id: string;
  number: number;
  title: string;
  description: string;
  teamviewerId: string;
  teamviewerPassword: string;
  priority: string;
  status: string;
  requester: User;
  assignedToId?: string | null;
  assignedTo?: User | null;
  attachments: Attachment[];
  activityLogs: ActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderRole: "USER" | "IT";
  content: string;
  createdAt: string;
  sender: User;
}

export interface ActivityLog {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
