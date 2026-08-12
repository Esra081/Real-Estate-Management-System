import { TestBed } from '@angular/core/testing';

import { Tasinmaz } from './tasinmaz';

describe('Tasinmaz', () => {
  let service: Tasinmaz;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tasinmaz);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
