import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TasinmazListe } from './tasinmaz-liste';

describe('TasinmazListe', () => {
  let component: TasinmazListe;
  let fixture: ComponentFixture<TasinmazListe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasinmazListe],
    }).compileComponents();

    fixture = TestBed.createComponent(TasinmazListe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
