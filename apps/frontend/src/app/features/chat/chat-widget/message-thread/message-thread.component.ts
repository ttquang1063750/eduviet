import { Component, inject, signal, computed, effect, viewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '@eduviet/shared-types';
import { ChatService } from '../../chat.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { getApiErrorMessage } from '../../../../core/utils/http-error';

// MIME types chấp nhận phía FE (khớp với BE)
const ACCEPTED_MIME = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
].join(',');

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

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
  private toast = inject(ToastService);

  private messagesContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');
  private fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly messageContent = signal('');
  readonly isUploading = signal(false);
  readonly currentUserId = computed(() => this.authService.user()?.id);
  readonly acceptedMime = ACCEPTED_MIME;

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

  onTyping(_event: Event) {
    const isTyping = this.messageContent().length > 0;
    this.chatService.sendTyping(isTyping);
  }

  /** Mở hộp thoại chọn file */
  attachFile() {
    this.fileInputRef()?.nativeElement.click();
  }

  /** Xử lý file được chọn → upload → gửi tin nhắn với mediaUrl */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validate phía client
    if (file.size > MAX_FILE_BYTES) {
      this.toast.error($localize`File quá lớn. Kích thước tối đa là 10MB`);
      input.value = '';
      return;
    }

    const roomId = this.chatService.activeRoomId();
    if (!roomId) return;

    this.isUploading.set(true);

    this.chatService.uploadFile(roomId, file).subscribe({
      next: (result) => {
        // Gửi tin nhắn với nội dung là tên file + mediaUrl
        const label = this.isImage(result.mimeType) ? file.name : `[FILE] ${file.name}`;
        this.chatService.sendMessage(label, result.url);
        this.isUploading.set(false);
        this.toast.success($localize`Đã gửi file thành công`);
      },
      error: (err: unknown) => {
        this.toast.error(getApiErrorMessage(err, $localize`Upload file thất bại`));
        this.isUploading.set(false);
      },
    });

    // Reset input để có thể chọn lại cùng file
    input.value = '';
  }

  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /** Trả về true nếu ít nhất 1 người khác (không phải currentUser) đã đọc tin nhắn này */
  isReadByOther(msg: ChatMessage): boolean {
    const myId = this.currentUserId();
    if (!myId || !msg.readBy?.length) return false;
    return msg.readBy.some(uid => uid !== myId);
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
    if (typers.length === 1) return $localize`${typers[0]} đang nhập...`;
    if (typers.length === 2) return $localize`${typers[0]} và ${typers[1]} đang nhập...`;
    return $localize`Nhiều người đang nhập...`;
  }
}
