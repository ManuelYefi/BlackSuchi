import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablesAdminComponent } from './tables-admin';

describe('TablesAdminComponent', () => {
  let component: TablesAdminComponent;
  let fixture: ComponentFixture<TablesAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablesAdminComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TablesAdminComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
