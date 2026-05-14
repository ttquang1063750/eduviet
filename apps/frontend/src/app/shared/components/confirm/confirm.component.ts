import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [],
  templateUrl: './confirm.component.html',
  styleUrl: './confirm.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmComponent {
  readonly confirmService = inject(ConfirmService);
  readonly state = this.confirmService.state;

  handle(result: boolean) {
    this.confirmService.handleAction(result);
  }
}
