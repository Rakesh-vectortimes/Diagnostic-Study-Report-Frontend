import { AfterViewInit, Component, ElementRef, Input, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
  template: `
    <div class="rich-text-editor">
      <label>{{ label }}</label>
      <div class="rich-text-toolbar" aria-label="Text formatting toolbar">
        <button type="button" (mousedown)="$event.preventDefault()" (click)="format('bold')" [disabled]="disabled">
          <strong>B</strong>
        </button>
        <button type="button" (mousedown)="$event.preventDefault()" (click)="format('italic')" [disabled]="disabled">
          <em>I</em>
        </button>
        <button type="button" (mousedown)="$event.preventDefault()" (click)="format('underline')" [disabled]="disabled">
          <u>U</u>
        </button>
        <button type="button" (mousedown)="$event.preventDefault()" (click)="format('insertUnorderedList')" [disabled]="disabled">
          • List
        </button>
        <button type="button" (mousedown)="$event.preventDefault()" (click)="format('insertOrderedList')" [disabled]="disabled">
          1. List
        </button>
        <select (change)="format('fontSize', $any($event.target).value)" [disabled]="disabled" aria-label="Font size">
          <option value="">Size</option>
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="4">Large</option>
          <option value="5">Extra Large</option>
        </select>
      </div>
      <div
        #editor
        class="rich-text-area"
        [attr.contenteditable]="disabled ? 'false' : 'true'"
        [attr.aria-label]="label"
        (input)="emitValue()"
        (blur)="onTouched()"
      ></div>
    </div>
  `,
  styles: [
    `
      .rich-text-editor {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      label {
        color: #006064;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .rich-text-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .rich-text-toolbar button,
      .rich-text-toolbar select {
        min-height: 30px;
        padding: 4px 8px;
        border: 1px solid #cfd8dc;
        border-radius: 4px;
        background: #fff;
        color: #263238;
        cursor: pointer;
      }

      .rich-text-toolbar button:disabled,
      .rich-text-toolbar select:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .rich-text-area {
        min-height: 110px;
        padding: 10px;
        border: 1px solid #9e9e9e;
        border-radius: 4px;
        background: #fff;
        overflow: auto;
        white-space: normal;
      }

      .rich-text-area:focus {
        outline: none;
        border-color: #00838f;
      }

      .rich-text-area[contenteditable='false'] {
        background: #f5f5f5;
      }
    `,
  ],
})
export class RichTextEditorComponent implements ControlValueAccessor, AfterViewInit {
  @Input() label = 'Text';
  @ViewChild('editor') private editor?: ElementRef<HTMLDivElement>;

  disabled = false;
  private value = '';
  private propagateChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  ngAfterViewInit(): void {
    this.setEditorHtml(this.value);
  }

  writeValue(value: string | null | undefined): void {
    this.value = value || '';
    this.setEditorHtml(this.value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  format(command: string, value?: string): void {
    if (this.disabled) {
      return;
    }
    this.editor?.nativeElement.focus();
    document.execCommand(command, false, value);
    this.emitValue();
  }

  emitValue(): void {
    this.value = this.editor?.nativeElement.innerHTML || '';
    this.propagateChange(this.value);
  }

  private setEditorHtml(value: string): void {
    if (this.editor) {
      this.editor.nativeElement.innerHTML = value;
    }
  }
}
