import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../../core/services/auth.service';
import {
  ChatRoom,
  ChatMessage,
  TypingIndicator,
} from '@eduviet/shared-types';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private socket: Socket | null = null;

  private readonly API = '/api/chat';

  // ── Signals State ──────────────────────────────────────────────────────────
  
  private _rooms = signal<ChatRoom[]>([]);
  private _activeRoomId = signal<string | null>(null);
  private _messagesMap = signal<Map<string, ChatMessage[]>>(new Map());
  private _typingUsersMap = signal<Map<string, string[]>>(new Map());
  private _isConnected = signal(false);

  readonly rooms = this._rooms.asReadonly();
  readonly activeRoomId = this._activeRoomId.asReadonly();
  readonly isConnected = this._isConnected.asReadonly();

  readonly activeRoomMessages = computed(() => {
    const roomId = this._activeRoomId();
    return roomId ? (this._messagesMap().get(roomId) ?? []) : [];
  });

  readonly activeRoomTyping = computed(() => {
    const roomId = this._activeRoomId();
    return roomId ? (this._typingUsersMap().get(roomId) ?? []) : [];
  });

  readonly totalUnread = computed(() => 
    this._rooms().reduce((acc, room) => acc + (room.unreadCount ?? 0), 0)
  );

  constructor() {
    // Tự động kết nối/ngắt kết nối dựa trên trạng thái auth
    effect(() => {
      const user = this.authService.user();
      if (user) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  // ── Connection ─────────────────────────────────────────────────────────────

  private connect() {
    if (this.socket?.connected) return;

    const token = this.authService.getAccessToken();
    if (!token) return;

    this.socket = io({
      auth: { token },
      transports: ['websocket'],
    });

    this.setupSocketListeners();
    this.loadRooms();
  }

  private disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._isConnected.set(false);
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this._isConnected.set(true);
      console.log('[ChatService] Connected to socket');
      
      const roomIds = this._rooms().map(r => r.id);
      if (roomIds.length > 0) {
        this.socket?.emit('join_rooms', roomIds);
      }
    });

    this.socket.on('disconnect', () => {
      this._isConnected.set(false);
    });

    this.socket.on('new_message', (message: ChatMessage) => {
      this.handleIncomingMessage(message);
    });

    this.socket.on('user_typing', (data: TypingIndicator) => {
      this.updateTypingStatus(data.roomId, data.fullName, true);
    });

    this.socket.on('user_stopped_typing', (data: { roomId: string; userId: string }) => {
      this.updateTypingStatus(data.roomId, '', false, data.userId);
    });

    this.socket.on('message_edited', (updated: ChatMessage) => {
      this.updateMessageInState(updated);
    });

    this.socket.on('message_deleted', (deleted: { id: string; roomId: string; deletedAt: Date }) => {
      this.removeMessageFromState(deleted.id, deleted.roomId);
    });

    this.socket.on('error', (err: any) => {
      console.error('[ChatService] Socket error:', err);
    });
  }

  // ── Room Management ────────────────────────────────────────────────────────

  loadRooms() {
    this.http.get<{ data: ChatRoom[] }>(`${this.API}/rooms`).subscribe((res) => {
      this._rooms.set(res.data);
      
      const roomIds = res.data.map((r) => r.id);
      if (roomIds.length > 0 && this.socket?.connected) {
        this.socket.emit('join_rooms', roomIds);
      }
    });
  }

  setActiveRoom(roomId: string | null) {
    this._activeRoomId.set(roomId);
    if (roomId) {
      this.loadMessages(roomId);
      this.markRead(roomId);
    }
  }

  getOrCreateOneOnOne(recipientId: string) {
    return this.http.post<{ data: ChatRoom }>(`${this.API}/rooms/one-on-one`, { recipientId }).pipe(
      tap((res) => {
        const exists = this._rooms().find(r => r.id === res.data.id);
        if (!exists) {
          this._rooms.update(rooms => [res.data, ...rooms]);
          this.socket?.emit('join_rooms', [res.data.id]);
        }
        this.setActiveRoom(res.data.id);
      })
    );
  }

  // ── Message Actions ────────────────────────────────────────────────────────

  loadMessages(roomId: string, cursor?: string) {
    let url = `${this.API}/rooms/${roomId}/messages?limit=50`;
    if (cursor) url += `&cursor=${cursor}`;

    this.http.get<{ data: ChatMessage[] }>(url).subscribe((res) => {
      this._messagesMap.update((map) => {
        const newMap = new Map(map);
        const existing = newMap.get(roomId) ?? [];
        
        const merged = cursor 
          ? [...existing, ...res.data]
          : res.data;

        newMap.set(roomId, merged);
        return newMap;
      });
    });
  }

  sendMessage(content: string, mediaUrl?: string) {
    const roomId = this._activeRoomId();
    if (!roomId || !this.socket) return;

    this.socket.emit('send_message', { roomId, content, mediaUrl });
  }

  editMessage(messageId: string, content: string) {
    this.socket?.emit('edit_message', { messageId, content });
  }

  deleteMessage(messageId: string) {
    this.socket?.emit('delete_message', { messageId });
  }

  sendTyping(isTyping: boolean) {
    const roomId = this._activeRoomId();
    if (!roomId || !this.socket) return;

    this.socket.emit(isTyping ? 'typing_start' : 'typing_stop', { roomId });
  }

  markRead(roomId: string) {
    this.socket?.emit('mark_read', { roomId });
    
    this._rooms.update(rooms => rooms.map(r => 
      r.id === roomId ? { ...r, unreadCount: 0 } : r
    ));
  }

  // ── State Helpers ──────────────────────────────────────────────────────────

  private handleIncomingMessage(message: ChatMessage) {
    this._messagesMap.update((map) => {
      const newMap = new Map(map);
      const roomMsgs = newMap.get(message.roomId) ?? [];
      newMap.set(message.roomId, [message, ...roomMsgs]);
      return newMap;
    });

    this._rooms.update((rooms) => {
      const index = rooms.findIndex((r) => r.id === message.roomId);
      if (index === -1) return rooms;

      const updatedRooms = [...rooms];
      const room = updatedRooms[index];
      
      updatedRooms[index] = {
        ...room,
        lastMessage: {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
          sender: { id: message.senderId, fullName: message.sender.fullName },
        },
        unreadCount: (room.id !== this._activeRoomId() && message.senderId !== this.authService.user()?.id)
          ? (room.unreadCount ?? 0) + 1 
          : room.unreadCount,
        updatedAt: new Date(),
      };

      const movedRoom = updatedRooms.splice(index, 1)[0];
      return [movedRoom, ...updatedRooms];
    });
  }

  private updateTypingStatus(roomId: string, fullName: string, isTyping: boolean, userId?: string) {
    this._typingUsersMap.update((map) => {
      const newMap = new Map(map);
      let users = newMap.get(roomId) ?? [];
      
      if (isTyping) {
        if (!users.includes(fullName)) {
          users = [...users, fullName];
        }
      } else {
        users = users.filter(u => u !== fullName);
      }

      newMap.set(roomId, users);
      return newMap;
    });
  }

  private updateMessageInState(updated: ChatMessage) {
    this._messagesMap.update((map) => {
      const newMap = new Map(map);
      const msgs = newMap.get(updated.roomId) ?? [];
      newMap.set(updated.roomId, msgs.map(m => m.id === updated.id ? updated : m));
      return newMap;
    });
  }

  private removeMessageFromState(messageId: string, roomId: string) {
    this._messagesMap.update((map) => {
      const newMap = new Map(map);
      const msgs = newMap.get(roomId) ?? [];
      newMap.set(roomId, msgs.map(m => 
        m.id === messageId 
          ? { ...m, deletedAt: new Date(), content: 'Tin nhắn đã bị xóa' } 
          : m
      ));
      return newMap;
    });
  }
}
