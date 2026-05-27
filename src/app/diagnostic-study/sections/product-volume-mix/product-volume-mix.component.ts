import { Component, input } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder } from '@angular/forms';
import {
  createProductVolumeRow,
  getFormArray,
  numericValue,
  recalcVolumePercents,
} from '../../utils/study-form.builder';

@Component({
  selector: 'app-product-volume-mix',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './product-volume-mix.component.html',
})
export class ProductVolumeMixComponent {
  parentForm = input.required<FormGroup>();
  private readonly fb = new FormBuilder();

  get array(): FormArray {
    return getFormArray(this.parentForm(), 'product_volume_mix');
  }

  addRow(): void {
    this.array.push(createProductVolumeRow(this.fb));
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
    recalcVolumePercents(this.array, 'annual_value', 'value_percent');
  }

  total(key: string): number {
    return this.array.controls.reduce((sum, row) => sum + numericValue(row.get(key)?.value), 0);
  }

  percentTotal(key: string): number {
    return this.total(key) > 0 ? 100 : 0;
  }
}
