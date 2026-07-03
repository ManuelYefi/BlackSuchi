export interface Expense {
  id: number;
  title: string;
  amount: number;
  notes?: string;
  expenseDate: string;
  createdAt?: string;
}
