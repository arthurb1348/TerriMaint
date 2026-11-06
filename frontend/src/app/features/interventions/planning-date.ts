import { ValidationErrors, ValidatorFn } from '@angular/forms';

export function localToday(): string {
  const today = new Date();
  // Une date de calendrier locale ne doit pas être décalée par une conversion en UTC.
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export function plannedDateErrors(value: string): ValidationErrors | null {
  if (!value) return { required: true };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { calendarDate: true };
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) {
    return { calendarDate: true };
  }
  // Le format ISO validé permet de comparer les jours sans créer d'instant horodaté.
  return value < localToday() ? { pastDate: true } : null;
}

export const plannedDateValidator: ValidatorFn = (control) => plannedDateErrors(control.value);
