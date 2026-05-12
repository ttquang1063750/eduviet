import { User } from './user.types';

export type ChatRoomType = 'CLASS' | 'TEACHER_PARENT' | 'ONE_ON_ONE' | 'STAFF';

export interface ChatRoomMember {
  userId: string;
  lastReadAt: Date | null;
  user: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'roles'>;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  sender: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'roles'>;
  content: string;
  mediaUrl: string | null;
  readBy: string[];   // mảng userId đã đọc tin nhắn này
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
}

export interface ChatRoom {
  id: string;
  name: string | null;
  type: ChatRoomType;
  classId: string | null;
  createdAt: Date;
  updatedAt: Date;
  members: ChatRoomMember[];
  lastMessage?: {
    id: string;
    content: string;
    createdAt: Date;
    sender: { id: string; fullName: string };
  };
  unreadCount?: number;
}

export interface TypingIndicator {
  roomId: string;
  userId: string;
  fullName: string;
}
