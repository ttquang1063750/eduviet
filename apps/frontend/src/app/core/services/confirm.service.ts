import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'primary' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private _state = signal<{
    options: ConfirmOptions;
    resolve: (result: boolean) => void;
  } | null>(null);

  readonly state = this._state.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this._state.set({
        options: {
          confirmText: 'Xác nhận',
          cancelText: 'Hủy',
          type: 'primary',
          ...options,
        },
        resolve,
      });
    });
  }

  handleAction(result: boolean) {
    const current = this._state();
    if (current) {
      current.resolve(result);
      this._state.set(null);
    }
  }
}
