import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../components/confirm-dialog/confirm-dialog.component';

export function openConfirmDialog(data: ConfirmDialogData): Observable<boolean> {
  const dialog = inject(MatDialog);
  return dialog
    .open(ConfirmDialogComponent, { width: '400px', data })
    .afterClosed();
}
