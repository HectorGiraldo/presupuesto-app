import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { parseAmountToCents, toEuros } from '@presupuesto/shared';

/**
 * Input de importe: el usuario escribe en euros con coma decimal ("12,34"),
 * pero el valor que sale por [(ngModel)]/formControl son siempre céntimos enteros,
 * que es el único formato que se guarda y se envía a la API.
 */
@Component({
  selector: 'app-money-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="money-input">
      <span class="suffix">€</span>
      <input
        type="text"
        inputmode="decimal"
        [ngModel]="text()"
        (ngModelChange)="onInput($event)"
        (blur)="onBlur()"
        [placeholder]="placeholder"
        [disabled]="disabled()"
      />
    </div>
  `,
  styles: [`
    .money-input {
      position: relative;
      display: flex;
      align-items: center;
    }
    input {
      width: 100%;
      padding: 0.6rem 0.7rem;
      padding-right: 1.8rem;
      border: 1.5px solid var(--color-line-strong);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--color-text);
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    input:focus {
      outline: none;
      box-shadow: var(--shadow-sm);
    }
    .suffix {
      position: absolute;
      right: 0.7rem;
      color: var(--color-text-muted);
      pointer-events: none;
    }
  `],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MoneyInputComponent), multi: true },
  ],
})
export class MoneyInputComponent implements ControlValueAccessor {
  placeholder = '0,00';

  protected readonly text = signal('');
  protected readonly disabled = signal(false);

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(cents: number | null): void {
    this.text.set(cents === null || cents === undefined ? '' : toEuros(cents).toFixed(2).replace('.', ','));
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(value: string): void {
    this.text.set(value);
    this.onChange(parseAmountToCents(value));
  }

  onBlur(): void {
    // Al perder el foco se normaliza el texto mostrado (ej. "12" -> "12,00").
    const cents = parseAmountToCents(this.text());
    this.text.set(cents === null ? '' : toEuros(cents).toFixed(2).replace('.', ','));
    this.onTouched();
  }
}
