import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ChatService } from '../chat.service';
import { RoomListComponent } from './room-list/room-list.component';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [RoomListComponent],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWidgetComponent {
  readonly chatService = inject(ChatService);
  
  // Trạng thái đóng/mở popup
  readonly isOpen = signal(false);

  toggleChat() {
    this.isOpen.update((v) => !v);
    
    // Nếu mở chat và đang ở trong một room, đánh dấu đã đọc
    if (this.isOpen() && this.chatService.activeRoomId()) {
      this.chatService.markRead(this.chatService.activeRoomId()!);
    }
  }

  closeChat() {
    this.isOpen.set(false);
  }
}
