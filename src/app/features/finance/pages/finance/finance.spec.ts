import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { FinanceApiService, FinanceMonth } from '../../data-access/finance-api.service';
import { Finance } from './finance';

describe('Finance', () => {
  let component: Finance;

  beforeEach(async () => {
    const monthData: FinanceMonth = {
      month: '2026-10',
      currency: 'PLN',
      categories: [
        { id: 'salary', label: 'Wynagrodzenie', type: 'income' },
        { id: 'groceries', label: 'Jedzenie', type: 'expense' },
      ],
      incomeTotal: 0,
      expenseTotal: 0,
      transactions: [],
      budgets: [],
    };

    await TestBed.configureTestingModule({
      imports: [Finance],
      providers: [
        provideRouter([]),
        {
          provide: FinanceApiService,
          useValue: {
            getMonth: () => of(monthData),
            createTransaction: () => of({}),
            deleteTransaction: () => of(undefined),
            upsertBudget: () => of({}),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Finance);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('rejects transaction amounts with more than two decimal places', () => {
    const amount = component.transactionForm.controls.amount;

    amount.setValue(1.001);
    expect(amount.hasError('decimalPlaces')).toBe(true);

    amount.setValue(1.01);
    expect(amount.valid).toBe(true);
  });

  it('rejects budget limits with more than two decimal places', () => {
    const limitAmount = component.budgetForm.controls.limitAmount;

    limitAmount.setValue(25.555);
    expect(limitAmount.hasError('decimalPlaces')).toBe(true);

    limitAmount.setValue(25.55);
    expect(limitAmount.valid).toBe(true);
  });

  it('displays finance categories in English', () => {
    expect(component.categoryName({ id: 'groceries', label: 'Jedzenie', type: 'expense' })).toBe('Groceries');
    expect(component.categoryName({ id: 'salary', label: 'Wynagrodzenie', type: 'income' })).toBe('Salary');
  });
});
