import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Expense } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpensesService {
  private readonly apiUrl = 'http://localhost:3001/api/expenses';

  readonly expenses = signal<Expense[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private readonly http: HttpClient) {}

  async loadExpenses(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const expenses = await firstValueFrom(this.http.get<Expense[]>(this.apiUrl));
      this.expenses.set(expenses);
    } catch (error) {
      console.error('[expenses-service] failed to load expenses', error);
      this.error.set('No fue posible cargar los gastos desde MySQL.');
      this.expenses.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async createExpense(payload: Omit<Expense, 'id' | 'createdAt'>): Promise<void> {
    const created = await firstValueFrom(this.http.post<Expense>(this.apiUrl, payload));
    this.expenses.set(
      [created, ...this.expenses()].sort(
        (a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
      )
    );
  }

  async deleteExpense(expenseId: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${expenseId}`));
    this.expenses.set(this.expenses().filter((expense) => expense.id !== expenseId));
  }
}
