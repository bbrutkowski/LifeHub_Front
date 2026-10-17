import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FinanceApiService, FinanceMonth } from './finance-api.service';

describe('FinanceApiService', () => {
  let service: FinanceApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FinanceApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the selected month and preserves the backend response shape', () => {
    const response: FinanceMonth = {
      month: '2026-04',
      currency: 'PLN',
      categories: [{ id: 'salary', label: 'Wynagrodzenie', type: 'income' }],
      incomeTotal: 5000,
      expenseTotal: 1200,
      transactions: [
        {
          id: 'tx-1',
          type: 'income',
          amount: 5000,
          category: 'salary',
          note: null,
          date: '2026-04-01',
        },
      ],
      budgets: [{ category: 'groceries', limitAmount: 900, spentAmount: 150 }],
    };

    let result: FinanceMonth | undefined;
    service.getMonth('2026-04').subscribe((value) => (result = value));

    const request = http.expectOne('https://localhost:7285/api/finance?month=2026-04');
    expect(request.request.method).toBe('GET');
    request.flush(response);
    expect(result).toEqual(response);
  });

  it('maps transaction creation, transaction deletion, and budget upsert to the agreed endpoints', () => {
    const newTransaction = {
      type: 'expense' as const,
      amount: 42.5,
      category: 'groceries',
      note: 'Zakupy',
      date: '2026-04-07',
    };
    const createdTransaction = { ...newTransaction, id: 'tx-2' };
    let receivedId = '';
    let budgetResult: unknown;

    service.createTransaction(newTransaction).subscribe((result) => (receivedId = result.id));
    const createRequest = http.expectOne('https://localhost:7285/api/finance/transactions');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(newTransaction);
    createRequest.flush(createdTransaction);

    service
      .upsertBudget({ month: '2026-04', category: 'groceries', limitAmount: 900 })
      .subscribe((result) => (budgetResult = result));
    const budgetRequest = http.expectOne('https://localhost:7285/api/finance/budgets');
    expect(budgetRequest.request.method).toBe('PUT');
    expect(budgetRequest.request.body).toEqual({
      month: '2026-04',
      category: 'groceries',
      limitAmount: 900,
    });
    const budgetResponse = { category: 'groceries', limitAmount: 900, spentAmount: 150 };
    budgetRequest.flush(budgetResponse);

    let deletionCompleted = false;
    service.deleteTransaction('tx-2').subscribe(() => (deletionCompleted = true));
    const deleteRequest = http.expectOne('https://localhost:7285/api/finance/transactions/tx-2');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);

    expect(receivedId).toBe('tx-2');
    expect(budgetResult).toEqual(budgetResponse);
    expect(deletionCompleted).toBe(true);
  });
});
