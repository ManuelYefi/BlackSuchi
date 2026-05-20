import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtrasAdminComponent } from './extras-admin';

describe('ExtrasAdminComponent', () => {
  let component: ExtrasAdminComponent;
  let fixture: ComponentFixture<ExtrasAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtrasAdminComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtrasAdminComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
