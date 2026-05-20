import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  selector: 'app-order-cart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './order-cart.html',
  styleUrl: './order-cart.scss'
})
export class OrderCartComponent {
  protected readonly orderService = inject(OrderService);

  increase(uid: string): void {
    this.orderService.increase(uid);
  }

  decrease(uid: string): void {
    this.orderService.decrease(uid);
  }

  remove(uid: string): void {
    this.orderService.remove(uid);
  }

  clear(): void {
    this.orderService.clear();
  }
}