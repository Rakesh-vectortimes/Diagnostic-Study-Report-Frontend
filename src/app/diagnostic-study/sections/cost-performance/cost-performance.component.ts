import { Component, OnDestroy, OnInit, input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { createHeadCountRow, getFormArray, numericValue } from '../../utils/study-form.builder';

@Component({
  selector: 'app-cost-performance',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule],
  templateUrl: './cost-performance.component.html',
})
export class CostPerformanceComponent implements OnInit, OnDestroy {
  parentForm = input.required<FormGroup>();
  private readonly fb = new FormBuilder();
  private readonly subscriptions = new Subscription();

  get headCountArray(): FormArray {
    return getFormArray(this.parentForm(), 'head_count_data');
  }

  get costDataGroup(): FormGroup {
    return this.parentForm().get('cost_data') as FormGroup;
  }

  addHeadCountRow(): void {
    this.headCountArray.push(createHeadCountRow(this.fb));
    this.recalculateCostData();
  }

  moveHeadCountRow(fromIndex: number, toIndex: number): void {
    if (toIndex < 0 || toIndex >= this.headCountArray.length) {
      return;
    }
    const row = this.headCountArray.at(fromIndex);
    this.headCountArray.removeAt(fromIndex);
    this.headCountArray.insert(toIndex, row);
    this.recalculateCostData();
  }

  removeHeadCountRow(i: number): void {
    this.headCountArray.removeAt(i);
    this.recalculateCostData();
  }

  total(key: string): number {
    return this.headCountArray.controls.reduce((sum, row) => sum + numericValue(row.get(key)?.value), 0);
  }

  ngOnInit(): void {
    this.subscriptions.add(this.costDataGroup.valueChanges.subscribe(() => this.recalculateCostData()));
    this.subscriptions.add(this.headCountArray.valueChanges.subscribe(() => this.recalculateCostData()));
    this.subscriptions.add(
      this.parentForm().get('company_background.working_days')?.valueChanges.subscribe(() => this.recalculateCostData())
    );
    this.recalculateCostData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private recalculateCostData(): void {
    const directSalary = numericValue(this.costDataGroup.get('total_direct_salary')?.value);
    const indirectSalary = numericValue(this.costDataGroup.get('total_indirect_salary')?.value);
    const overheads = numericValue(this.costDataGroup.get('total_overheads')?.value);
    const monthlyOutput = numericValue(this.costDataGroup.get('avg_monthly_output')?.value);
    const workingDays = numericValue(this.parentForm().get('company_background.working_days')?.value);
    const sewingOperators = this.sewingOperators();

    this.costDataGroup.patchValue(
      {
        operating_expenses: this.round(directSalary + indirectSalary + overheads),
        productivity_per_person: workingDays > 0 && sewingOperators > 0
          ? this.round(monthlyOutput / workingDays / sewingOperators)
          : 0,
      },
      { emitEvent: false }
    );
  }

  private sewingOperators(): number {
    const sewingRow = this.headCountArray.controls.find((row) =>
      String(row.get('department')?.value || '').trim().toLowerCase() === 'sewing'
    );
    return numericValue(sewingRow?.get('operators')?.value);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
