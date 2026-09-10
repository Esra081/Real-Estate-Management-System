import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  static noWhitespace(control: AbstractControl): ValidationErrors | null {
    if (control.value === null || control.value === undefined) {
      return null;
    }
    const isWhitespace = String(control.value).trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  }

  static minCoordinates(minPoints: number = 4): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (!val || !Array.isArray(val) || val.length < minPoints) {
        return { minCoordinates: { required: minPoints, actual: val?.length || 0 } };
      }
      return null;
    };
  }
}
