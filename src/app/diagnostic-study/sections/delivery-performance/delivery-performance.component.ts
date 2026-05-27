import { Component, OnInit, input } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { createPerformanceRow, getFormArray } from '../../utils/study-form.builder';

@Component({
  selector: 'app-delivery-performance',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule],
  templateUrl: './delivery-performance.component.html',
})
export class DeliveryPerformanceComponent implements OnInit {
  parentForm = input.required<FormGroup>();
  private readonly fb = new FormBuilder();
  statusOptions = [
    { value: 1, label: 'Measured' },
    { value: 2, label: 'Not Measured' },
  ];

  get array(): FormArray {
    return getFormArray(this.parentForm(), 'delivery_performance');
  }

  ngOnInit(): void {
    this.array.controls.forEach((row) => {
      this.normalizeStatus(row);
      this.syncRowAccess(row);
    });
  }

  addRow(): void {
    const row = createPerformanceRow(this.fb);
    this.syncRowAccess(row);
    this.array.push(row);
  }

  moveRow(fromIndex: number, toIndex: number): void {
    if (toIndex < 0 || toIndex >= this.array.length) {
      return;
    }
    const row = this.array.at(fromIndex);
    this.array.removeAt(fromIndex);
    this.array.insert(toIndex, row);
  }

  removeRow(i: number): void {
    this.array.removeAt(i);
  }

  isMeasured(row: AbstractControl): boolean {
    const status = row.get('status')?.value;
    return status === 1 || status === '1' || status === 'measured';
  }

  onStatusChange(row: AbstractControl): void {
    this.syncRowAccess(row);
  }

  private syncRowAccess(row: AbstractControl): void {
    const value = row.get('value');
    const remark = row.get('remark');
    const measured = this.isMeasured(row);

    if (measured) {
      value?.enable({ emitEvent: false });
      remark?.enable({ emitEvent: false });
      return;
    }

    value?.disable({ emitEvent: false });
    remark?.disable({ emitEvent: false });
  }

  private normalizeStatus(row: AbstractControl): void {
    const status = row.get('status')?.value;
    if (status === 'measured') {
      row.get('status')?.setValue(1, { emitEvent: false });
    } else if (status === 'not_measured') {
      row.get('status')?.setValue(2, { emitEvent: false });
    }
  }
}
