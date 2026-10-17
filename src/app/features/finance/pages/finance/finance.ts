import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FinanceApiService,
  FinanceBudget,
  FinanceCategory,
  FinanceMonth,
  FinanceTransaction,
  FinanceType,
} from '../../data-access/finance-api.service';

type TransactionForm = FormGroup<{
  type: FormControl<FinanceType>;
  amount: FormControl<number | null>;
  category: FormControl<string>;
  date: FormControl<string>;
  note: FormControl<string>;
}>;

type BudgetForm = FormGroup<{
  category: FormControl<string>;
  limitAmount: FormControl<number | null>;
}>;

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './finance.html',
  styleUrl: './finance.css',
})
export class Finance implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private monthRequest?: { unsubscribe(): void };

  readonly transactionForm: TransactionForm = new FormGroup({
    type: new FormControl<FinanceType>('expense', { nonNullable: true }),
    amount: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(9999999999999999.99),
      this.twoDecimalPlacesValidator,
    ]),
    category: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    date: new FormControl(this.today(), { nonNullable: true, validators: [Validators.required] }),
    note: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(250)] }),
  });
  readonly budgetForm: BudgetForm = new FormGroup({
    category: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    limitAmount: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(9999999999999999.99),
      this.twoDecimalPlacesValidator,
    ]),
  });

  month = this.currentMonth();
  data: FinanceMonth | null = null;
  loading = false;
  savingTransaction = false;
  savingBudget = false;
  deletingTransactionId: string | null = null;
  errorMessage: string | null = null;

  constructor(private readonly financeApi: FinanceApiService) {}

  ngOnInit(): void {
    this.loadMonth();
  }

  get transactionCategories(): FinanceCategory[] {
    const type = this.transactionForm.controls.type.value;
    return (this.data?.categories ?? []).filter((category) => category.type === type);
  }

  get expenseCategories(): FinanceCategory[] {
    return (this.data?.categories ?? []).filter((category) => category.type === 'expense');
  }

  get transactions(): FinanceTransaction[] {
    return this.data?.transactions ?? [];
  }

  get budgets(): FinanceBudget[] {
    return this.data?.budgets ?? [];
  }

  categoryName(category: FinanceCategory): string {
    const names: Record<string, string> = {
      salary: 'Salary',
      'other-income': 'Other income',
      housing: 'Housing',
      groceries: 'Groceries',
      transport: 'Transport',
      health: 'Health',
      leisure: 'Leisure',
      other: 'Other',
    };

    return names[category.id] ?? category.label;
  }

  onMonthChange(value: string): void {
    if (!/^\d{4}-\d{2}$/.test(value) || value === this.month) {
      return;
    }
    this.month = value;
    this.transactionForm.controls.date.setValue(this.defaultDateForMonth(value));
    this.loadMonth();
  }

  onTransactionTypeChange(): void {
    const categories = this.transactionCategories;
    const currentCategory = this.transactionForm.controls.category.value;
    if (!categories.some((category) => category.id === currentCategory)) {
      this.transactionForm.controls.category.setValue(categories[0]?.id ?? '');
    }
  }

  loadMonth(): void {
    this.monthRequest?.unsubscribe();
    this.loading = true;
    this.errorMessage = null;
    this.monthRequest = this.financeApi
      .getMonth(this.month)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (data) => {
          this.data = data;
          this.ensureSelectedCategories();
        },
        error: () => {
          this.data = null;
          this.errorMessage = 'Could not load finance data. Check your connection and try again.';
        },
      });
  }

  saveTransaction(): void {
    if (this.transactionForm.invalid || this.savingTransaction) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    const values = this.transactionForm.getRawValue();
    this.savingTransaction = true;
    this.errorMessage = null;
    this.financeApi
      .createTransaction({
        type: values.type,
        amount: values.amount!,
        category: values.category,
        note: values.note.trim() || null,
        date: values.date,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.savingTransaction = false;
        }),
      )
      .subscribe({
        next: () => {
          this.transactionForm.reset({
            type: 'expense',
            amount: null,
            category: this.expenseCategories[0]?.id ?? '',
            date: this.defaultDateForMonth(this.month),
            note: '',
          });
          this.loadMonth();
        },
        error: () => {
          this.errorMessage = 'Could not add the transaction. Check the details and try again.';
        },
      });
  }

  deleteTransaction(transaction: FinanceTransaction): void {
    if (this.deletingTransactionId) {
      return;
    }
    this.deletingTransactionId = transaction.id;
    this.errorMessage = null;
    this.financeApi
      .deleteTransaction(transaction.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.deletingTransactionId = null;
        }),
      )
      .subscribe({
        next: () => this.loadMonth(),
        error: () => {
          this.errorMessage = 'Could not delete the transaction. Please try again.';
        },
      });
  }

  saveBudget(): void {
    if (this.budgetForm.invalid || this.savingBudget) {
      this.budgetForm.markAllAsTouched();
      return;
    }

    const values = this.budgetForm.getRawValue();
    this.savingBudget = true;
    this.errorMessage = null;
    this.financeApi
      .upsertBudget({
        month: this.month,
        category: values.category,
        limitAmount: values.limitAmount!,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.savingBudget = false;
        }),
      )
      .subscribe({
        next: () => this.loadMonth(),
        error: () => {
          this.errorMessage = 'Could not save the budget. Please try again.';
        },
      });
  }

  selectBudget(budget: FinanceBudget): void {
    this.budgetForm.patchValue({
      category: budget.category,
      limitAmount: budget.limitAmount,
    });
  }

  categoryLabel(categoryId: string): string {
    const category = this.data?.categories.find((item) => item.id === categoryId);
    return category ? this.categoryName(category) : categoryId;
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: this.data?.currency || 'PLN',
    }).format(value);
  }

  formatDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(year, month - 1, day),
    );
  }

  budgetProgress(budget: FinanceBudget): number {
    if (budget.limitAmount <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((budget.spentAmount / budget.limitAmount) * 100));
  }

  trackTransaction(_index: number, transaction: FinanceTransaction): string {
    return transaction.id;
  }

  trackBudget(_index: number, budget: FinanceBudget): string {
    return budget.category;
  }

  private ensureSelectedCategories(): void {
    const transactionCategory = this.transactionForm.controls.category.value;
    if (!this.transactionCategories.some((category) => category.id === transactionCategory)) {
      this.transactionForm.controls.category.setValue(this.transactionCategories[0]?.id ?? '');
    }

    const budgetCategory = this.budgetForm.controls.category.value;
    if (!this.expenseCategories.some((category) => category.id === budgetCategory)) {
      this.budgetForm.controls.category.setValue(this.expenseCategories[0]?.id ?? '');
    }
  }

  private currentMonth(): string {
    return this.today().slice(0, 7);
  }

  private defaultDateForMonth(month: string): string {
    return month === this.currentMonth() ? this.today() : `${month}-01`;
  }

  private today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private twoDecimalPlacesValidator(control: AbstractControl<number | null>): ValidationErrors | null {
    const amount = control.value;
    if (amount === null || !Number.isFinite(amount)) {
      return null;
    }

    return Number(amount.toFixed(2)) === amount ? null : { decimalPlaces: true };
  }
}
