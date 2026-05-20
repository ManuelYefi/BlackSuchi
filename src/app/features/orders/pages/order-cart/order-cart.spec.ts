import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderCartComponent } from './order-cart';

describe('OrderCartComponent', () => {
  let component: OrderCartComponent;
  let fixture: ComponentFixture<OrderCartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderCartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderCartComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
