import { Component, input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  createCustomerBaseRow,
  getFormArray,
  numericValue,
  recalcVolumePercents,
} from '../../utils/study-form.builder';

@Component({
  selector: 'app-customer-base',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule],
  templateUrl: './customer-base.component.html',
})
export class CustomerBaseComponent {
  parentForm = input.required<FormGroup>();
  private readonly fb = new FormBuilder();

  get array(): FormArray {
    return getFormArray(this.parentForm(), 'customer_base');
  }

  addRow(): void {
    this.array.push(createCustomerBaseRow(this.fb));
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
    this.recalc();
  }

  recalc(): void {
    recalcVolumePercents(this.array, 'annual_volume', 'volume_percent');
  }

  total(key: string): number {
    return this.array.controls.reduce((sum, row) => sum + numericValue(row.get(key)?.value), 0);
  }

  percentTotal(): number {
    return this.total('annual_volume') > 0 ? 100 : 0;
  }
}
