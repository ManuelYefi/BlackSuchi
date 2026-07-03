import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Expense } from '../../../../core/models/expense.model';
import { ExpensesService } from '../../../../core/services/expenses.service';

const ADMIN_DATA_SESSION_KEY = 'black-sushi-admin-data-auth';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '1351';
const WORKER_EXPENSE_TAG = '[worker-shift]';

type WorkerShiftConfig = {
  key: string;
  label: string;
  amount: number;
  description: string;
};

@Component({
  selector: 'app-admin-data',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './admin-data.html',
  styleUrl: './admin-data.scss'
})
export class AdminDataComponent implements OnInit {
  private readonly expensesService = inject(ExpensesService);
  protected readonly workerShifts: WorkerShiftConfig[] = [
    {
      key: 'worker-a',
      label: 'Trabajador 1',
      amount: 15000,
      description: 'Pago diario fijo de CLP 15.000'
    },
    {
      key: 'worker-b',
      label: 'Trabajador 2',
      amount: 10000,
      description: 'Pago diario fijo de CLP 10.000'
    }
  ];

  protected readonly expenses = this.expensesService.expenses;
  protected readonly loading = this.expensesService.loading;
  protected readonly error = this.expensesService.error;
  protected readonly isAuthenticated = signal(false);
  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly loginError = signal('');
  protected readonly saving = signal(false);
  protected readonly title = signal('');
  protected readonly amount = signal('');
  protected readonly notes = signal('');
  protected readonly expenseDate = signal(this.getTodayDateInputValue());
  protected readonly totalExpenses = computed(() =>
    this.expenses().reduce((sum, expense) => sum + expense.amount, 0)
  );
  protected readonly selectedWorkerExpenses = computed(() => {
    const selectedDate = this.expenseDate();

    return this.workerShifts.map((worker) => ({
      ...worker,
      expense: this.findWorkerExpense(worker, selectedDate),
      active: Boolean(this.findWorkerExpense(worker, selectedDate))
    }));
  });

  async ngOnInit(): Promise<void> {
    const isAuthorized =
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(ADMIN_DATA_SESSION_KEY) === 'true';

    this.isAuthenticated.set(isAuthorized);

    if (isAuthorized) {
      await this.expensesService.loadExpenses();
    }
  }

  async login(): Promise<void> {
    const username = this.username().trim();
    const password = this.password().trim();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      window.sessionStorage.setItem(ADMIN_DATA_SESSION_KEY, 'true');
      this.isAuthenticated.set(true);
      this.loginError.set('');
      this.password.set('');
      await this.expensesService.loadExpenses();
      return;
    }

    this.loginError.set('Credenciales inválidas. Usa el acceso de administrador.');
  }

  logout(): void {
    window.sessionStorage.removeItem(ADMIN_DATA_SESSION_KEY);
    this.isAuthenticated.set(false);
    this.username.set('');
    this.password.set('');
    this.loginError.set('');
  }

  async saveExpense(): Promise<void> {
    const title = this.title().trim();
    const amount = Number(this.amount());
    const expenseDate = this.expenseDate().trim();

    if (!title || !expenseDate || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    this.saving.set(true);

    try {
      await this.expensesService.createExpense({
        title,
        amount,
        notes: this.notes().trim() || undefined,
        expenseDate: new Date(`${expenseDate}T12:00:00`).toISOString()
      });

      this.title.set('');
      this.amount.set('');
      this.notes.set('');
      this.expenseDate.set(this.getTodayDateInputValue());
    } finally {
      this.saving.set(false);
    }
  }

  async deleteExpense(expense: Expense): Promise<void> {
    const confirmed = window.confirm(
      `¿Eliminar el gasto "${expense.title}" por ${new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0
      }).format(expense.amount)}?`
    );

    if (!confirmed) {
      return;
    }

    await this.expensesService.deleteExpense(expense.id);
  }

  async toggleWorkerShift(worker: WorkerShiftConfig): Promise<void> {
    const expenseDate = this.expenseDate().trim();

    if (!expenseDate) {
      return;
    }

    const existingExpense = this.findWorkerExpense(worker, expenseDate);

    if (existingExpense) {
      await this.expensesService.deleteExpense(existingExpense.id);
      return;
    }

    await this.expensesService.createExpense({
      title: `${worker.label} · Turno diario`,
      amount: worker.amount,
      notes: `${WORKER_EXPENSE_TAG} ${worker.key}`,
      expenseDate: new Date(`${expenseDate}T12:00:00`).toISOString()
    });
  }

  private getTodayDateInputValue(): string {
    const date = new Date();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private findWorkerExpense(worker: WorkerShiftConfig, expenseDate: string): Expense | undefined {
    return this.expenses().find(
      (expense) =>
        expense.title === `${worker.label} · Turno diario` &&
        expense.amount === worker.amount &&
        expense.notes?.includes(`${WORKER_EXPENSE_TAG} ${worker.key}`) &&
        this.getDateInputValue(expense.expenseDate) === expenseDate
    );
  }

  private getDateInputValue(value: string): string {
    const date = new Date(value);
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
