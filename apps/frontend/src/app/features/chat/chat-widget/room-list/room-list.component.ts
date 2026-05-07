import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ChatService } from '../../chat.service';
import { ChatRoom } from '@eduviet/shared-types';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './room-list.component.html',
  styleUrl: './room-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomListComponent {
  readonly chatService = inject(ChatService);
  
  // Tab hiện tại: ALL, CLASS, DIRECT
  readonly currentTab = signal<'ALL' | 'CLASS' | 'DIRECT'>('ALL');

  readonly filteredRooms = computed(() => {
    const rooms = this.chatService.rooms();
    const tab = this.currentTab();

    if (tab === 'ALL') return rooms;
    if (tab === 'CLASS') return rooms.filter(r => r.type === 'CLASS');
    if (tab === 'DIRECT') return rooms.filter(r => r.type === 'ONE_ON_ONE');
    return rooms;
  });

  selectRoom(room: ChatRoom) {
    this.chatService.setActiveRoom(room.id);
  }

  getRoomName(room: ChatRoom): string {
    if (room.name) return room.name;
    if (room.type === 'ONE_ON_ONE') {
      // Tìm thành viên không phải là mình
      // Lưu ý: Cần inject AuthService để biết mình là ai
      // Nhưng tạm thời hiển thị placeholder hoặc lấy từ members
      return 'Trò chuyện trực tiếp';
    }
    return 'Phòng không tên';
  }
}
