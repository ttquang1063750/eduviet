import { Component, inject, signal, computed, effect, viewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../chat.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-message-thread',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './message-thread.component.html',
  styleUrl: './message-thread.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageThreadComponent {
  readonly chatService = inject(ChatService);
  readonly authService = inject(AuthService);
  
  private messagesContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  readonly messageContent = signal('');
  readonly currentUserId = computed(() => this.authService.user()?.id);

  constructor() {
    // Tự động cuộn xuống cuối khi có tin nhắn mới
    effect(() => {
      const messages = this.chatService.activeRoomMessages();
      if (messages.length > 0) {
        // Chờ một chút để DOM render xong
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });
  }

  sendMessage() {
    const content = this.messageContent().trim();
    if (!content) return;

    this.chatService.sendMessage(content);
    this.messageContent.set('');
    this.chatService.sendTyping(false);
  }

  onTyping(event: Event) {
    const isTyping = this.messageContent().length > 0;
    this.chatService.sendTyping(isTyping);
  }

  private scrollToBottom() {
    const el = this.messagesContainer()?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }

  getTypingText(): string {
    const typers = this.chatService.activeRoomTyping();
    if (typers.length === 0) return '';
    if (typers.length === 1) return `${typers[0]} đang nhập...`;
    if (typers.length === 2) return `${typers[0]} và ${typers[1]} đang nhập...`;
    return 'Nhiều người đang nhập...';
  }
}
