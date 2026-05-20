import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductDetailModalComponent } from './product-detail-modal';

describe('ProductDetailModalComponent', () => {
  let component: ProductDetailModalComponent;
  let fixture: ComponentFixture<ProductDetailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', {
      id: 'test-product',
      name: 'Test Product',
      category: 'Promos Black',
      price: 1000,
      active: true
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
