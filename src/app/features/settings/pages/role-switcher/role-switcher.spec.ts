import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleSwitcherComponent } from './role-switcher';

describe('RoleSwitcherComponent', () => {
  let component: RoleSwitcherComponent;
  let fixture: ComponentFixture<RoleSwitcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleSwitcherComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleSwitcherComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
