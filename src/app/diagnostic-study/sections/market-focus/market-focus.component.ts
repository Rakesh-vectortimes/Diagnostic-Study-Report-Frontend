import { Component, input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  createMarketFocusRow,
  getFormArray,
  numericValue,
  recalcVolumePercents,
} from '../../utils/study-form.builder';

@Component({
  selector: 'app-market-focus',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule],
  templateUrl: './market-focus.component.html',
})
export class MarketFocusComponent {
  parentForm = input.required<FormGroup>();
  private readonly fb = new FormBuilder();

  get array(): FormArray {
    return getFormArray(this.parentForm(), 'market_focus');
  }

  addRow(): void {
    this.array.push(createMarketFocusRow(this.fb));
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
    recalcVolumePercents(this.array, 'volume', 'volume_percent');
  }

  total(key: string): number {
    return this.array.controls.reduce((sum, row) => sum + numericValue(row.get(key)?.value), 0);
  }

  percentTotal(): number {
    return this.total('volume') > 0 ? 100 : 0;
  }
}
