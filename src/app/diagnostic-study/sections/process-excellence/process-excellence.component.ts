import { Component, OnInit, input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { createImprovementProjectRow } from '../../utils/study-form.builder';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';

@Component({
  selector: 'app-process-excellence',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    RichTextEditorComponent,
  ],
  templateUrl: './process-excellence.component.html',
})
export class ProcessExcellenceComponent implements OnInit {
  formGroup = input.required<FormGroup>();
  private readonly fb = new FormBuilder();
  leanBeltLevels = [
    { value: 1, label: 'White' },
    { value: 2, label: 'Yellow' },
    { value: 3, label: 'Green' },
    { value: 4, label: 'Black' },
    { value: 5, label: 'Master Black' },
  ];
  fiveSLevels = [
    { value: 1, label: 'Excellence' },
    { value: 2, label: 'Sustenance' },
    { value: 3, label: 'Model' },
  ];
  leanPracticeMethods = [
    { value: 1, label: 'Self implementation' },
    { value: 2, label: 'Hired coach' },
  ];

  get improvementProjects(): FormArray {
    return this.formGroup().get('improvement_projects') as FormArray;
  }

  ngOnInit(): void {
    this.normalizeEnumControl('lean_belt_level', this.leanBeltLevels);
    this.normalizeEnumControl('five_s_level', this.fiveSLevels);
    this.normalizeEnumControl('lean_practice_details', this.leanPracticeMethods);
  }

  isYes(controlName: string): boolean {
    return this.formGroup().get(controlName)?.value === 'yes';
  }

  addProject(): void {
    this.improvementProjects.push(createImprovementProjectRow(this.fb));
  }

  moveProject(fromIndex: number, toIndex: number): void {
    if (toIndex < 0 || toIndex >= this.improvementProjects.length) {
      return;
    }
    const row = this.improvementProjects.at(fromIndex);
    this.improvementProjects.removeAt(fromIndex);
    this.improvementProjects.insert(toIndex, row);
  }

  removeProject(i: number): void {
    this.improvementProjects.removeAt(i);
  }

  private normalizeEnumControl(controlName: string, options: { value: number; label: string }[]): void {
    const control = this.formGroup().get(controlName);
    const value = control?.value;
    const numeric = Number(value);
    if (Number.isFinite(numeric) && options.some((option) => option.value === numeric)) {
      control?.setValue(numeric, { emitEvent: false });
      return;
    }
    const match = options.find((option) => option.label.toLowerCase() === String(value || '').replace(/_/g, ' ').toLowerCase());
    if (match) {
      control?.setValue(match.value, { emitEvent: false });
    }
  }
}
