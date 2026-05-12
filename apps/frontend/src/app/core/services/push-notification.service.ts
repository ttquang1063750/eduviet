import { Injectable } from '@angular/core';

/**
 * PushNotificationService — quản lý Browser Notification API.
 * Chỉ request permission sau khi user đã login; không bao giờ hỏi lại nếu đã denied.
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationService {

  get permission(): NotificationPermission {
    return 'Notification' in window ? Notification.permission : 'denied';
  }

  /** Yêu cầu quyền hiển thị notification. Gọi sau khi user đăng nhập thành công. */
  async requestPermission(): Promise<void> {
    if (!('Notification' in window)) return;
    if (this.permission === 'granted' || this.permission === 'denied') return;

    await Notification.requestPermission();
  }

  /**
   * Hiển thị notification — chỉ khi:
   * - Browser hỗ trợ Notification API
   * - User đã grant permission
   * - Document hiện đang ở background (document.hidden === true)
   */
  show(title: string, body: string, icon?: string): void {
    if (!('Notification' in window)) return;
    if (this.permission !== 'granted') return;
    if (!document.hidden) return; // Không thông báo nếu user đang xem trang

    new Notification(title, {
      body,
      icon: icon ?? '/favicon.ico',
      badge: '/favicon.ico',
    });
  }
}
