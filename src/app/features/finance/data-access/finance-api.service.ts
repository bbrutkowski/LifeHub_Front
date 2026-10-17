import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export type FinanceType = 'income' | 'expense';

export interface FinanceCategory {
  id: string;
  label: string;
  type: FinanceType;
}

export interface FinanceTransaction {
  id: string;
  type: FinanceType;
  amount: number;
  category: string;
  note: string | null;
  date: string;
}

export interface FinanceBudget {
  category: string;
  limitAmount: number;
  spentAmount: number;
}

export interface FinanceMonth {
  month: string;
  currency: string;
  categories: FinanceCategory[];
  incomeTotal: number;
  expenseTotal: number;
  transactions: FinanceTransaction[];
  budgets: FinanceBudget[];
}

export interface CreateTransactionRequest {
  type: FinanceType;
  amount: number;
  category: string;
  note: string | null;
  date: string;
}

export interface UpsertBudgetRequest {
  month: string;
  category: string;
  limitAmount: number;
}

@Injectable({ providedIn: 'root' })
export class FinanceApiService {
  private readonly financePath = '/api/finance';

  constructor(private readonly api: ApiService) {}

  getMonth(month: string): Observable<FinanceMonth> {
    const params = new HttpParams().set('month', month);
    return this.api.get<FinanceMonth>(this.financePath, params);
  }

  createTransaction(request: CreateTransactionRequest): Observable<FinanceTransaction> {
    return this.api.post<FinanceTransaction>(`${this.financePath}/transactions`, request);
  }

  deleteTransaction(id: string): Observable<void> {
    return this.api.delete<void>(`${this.financePath}/transactions/${encodeURIComponent(id)}`);
  }

  upsertBudget(request: UpsertBudgetRequest): Observable<FinanceBudget> {
    return this.api.put<FinanceBudget>(`${this.financePath}/budgets`, request);
  }
}
