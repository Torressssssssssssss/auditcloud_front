import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoPaypalComponent } from './pago-paypal-component';

describe('PagoPaypalComponent', () => {
  let component: PagoPaypalComponent;
  let fixture: ComponentFixture<PagoPaypalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagoPaypalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoPaypalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
