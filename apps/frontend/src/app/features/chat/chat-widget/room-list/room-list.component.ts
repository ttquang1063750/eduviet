import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../chat.service';
import { UsersService } from '../../../../core/services/users.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ChatRoom, User, PaginatedResponse } from '@eduviet/shared-types';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of, catchError } from 'rxjs';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './room-list.component.html',
  styleUrl: './room-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomListComponent implements OnInit {
  readonly chatService = inject(ChatService);
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);

  // Tab hiện tại: ALL, CLASS, DIRECT
  readonly currentTab = signal<'ALL' | 'CLASS' | 'DIRECT'>('ALL');

  // New conversation panel
  readonly showNewChat = signal(false);
  readonly userSearchTerm = signal('');
  readonly userResults = signal<User[]>([]);
  readonly searchingUsers = signal(false);
  readonly userSearchError = signal<string | null>(null);
  readonly startingChat = signal<string | null>(null);
  readonly deletingRoomId = signal<string | null>(null);

  private readonly searchSubject = new Subject<string>();

  readonly filteredRooms = computed(() => {
    const rooms = this.chatService.rooms();
    const tab = this.currentTab();

    if (tab === 'ALL') return rooms;
    if (tab === 'CLASS') return rooms.filter(r => r.type === 'CLASS');
    if (tab === 'DIRECT') return rooms.filter(r => r.type === 'ONE_ON_ONE');
    return rooms;
  });

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => {
        this.searchingUsers.set(true);
        this.userSearchError.set(null);
        if (!term.trim()) {
          this.searchingUsers.set(false);
          const empty: PaginatedResponse<User> = { data: [], meta: { total: 0, page: 1, perPage: 10, totalPages: 0 } };
          return of(empty);
        }
        return this.usersService.getAll({ search: term, perPage: 10 }).pipe(
          catchError(() => {
            this.userSearchError.set('Không có quyền tìm kiếm người dùng.');
            this.searchingUsers.set(false);
            const empty: PaginatedResponse<User> = { data: [], meta: { total: 0, page: 1, perPage: 10, totalPages: 0 } };
            return of(empty);
          }),
        );
      }),
    ).subscribe((res) => {
      const myId = this.authService.user()?.id;
      this.userResults.set(res.data.filter((u: User) => u.id !== myId));
      this.searchingUsers.set(false);
    });
  }

  toggleNewChat(): void {
    this.showNewChat.update(v => !v);
    if (!this.showNewChat()) {
      this.userSearchTerm.set('');
      this.userResults.set([]);
    }
  }

  deleteRoom(event: Event, roomId: string): void {
    event.stopPropagation();
    this.deletingRoomId.set(roomId);
    this.chatService.deleteRoom(roomId).subscribe({
      next: () => this.deletingRoomId.set(null),
      error: () => this.deletingRoomId.set(null),
    });
  }

  onUserSearch(term: string): void {
    this.userSearchTerm.set(term);
    this.searchSubject.next(term);
  }

  startChat(user: User): void {
    this.startingChat.set(user.id);
    this.chatService.getOrCreateOneOnOne(user.id).subscribe({
      next: () => {
        this.showNewChat.set(false);
        this.userSearchTerm.set('');
        this.userResults.set([]);
        this.startingChat.set(null);
      },
      error: () => this.startingChat.set(null),
    });
  }

  selectRoom(room: ChatRoom): void {
    this.chatService.setActiveRoom(room.id);
  }

  getRoomName(room: ChatRoom): string {
    if (room.name) return room.name;
    if (room.type === 'ONE_ON_ONE') return 'Trò chuyện trực tiếp';
    return 'Phòng không tên';
  }
}
