import { signal } from '@angular/core';

export interface IncidentCoordinates {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy?: number;
}

export function validCoordinates(value: IncidentCoordinates): boolean {
  return (
    Number.isFinite(value.latitude) &&
    Math.abs(value.latitude) <= 90 &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.longitude) <= 180 &&
    (value.accuracy === undefined || (Number.isFinite(value.accuracy) && value.accuracy >= 0))
  );
}

export class IncidentLocation {
  readonly value = signal<IncidentCoordinates | undefined>(undefined);
  readonly message = signal('');
  readonly pending = signal(false);
  private generation = 0;

  request(geolocation: Geolocation | undefined, stillCurrent: () => boolean): void {
    const generation = ++this.generation;
    this.pending.set(false);
    if (!geolocation) {
      this.message.set(
        'La localisation n’est pas disponible dans ce navigateur. Vous pouvez continuer sans localisation.',
      );
      return;
    }
    this.pending.set(true);
    this.message.set('Recherche de votre position…');
    const current = () => generation === this.generation && stillCurrent();
    const failure = (code: number) => {
      if (!current()) return;
      this.pending.set(false);
      this.message.set(
        (code === 1
          ? 'Autorisation de localisation refusée.'
          : code === 3
            ? 'Le délai de recherche de position est dépassé.'
            : 'Votre position est indisponible.') +
          ' Vous pouvez réessayer ou continuer sans localisation.',
      );
    };
    try {
      geolocation.getCurrentPosition(
        (position) => {
          if (!current()) return;
          const { latitude, longitude, accuracy } = position.coords;
          const value = { latitude, longitude, ...(accuracy == null ? {} : { accuracy }) };
          if (!validCoordinates(value)) {
            failure(2);
            return;
          }
          this.value.set(Object.freeze(value));
          this.pending.set(false);
          this.message.set('Position obtenue.');
        },
        (error) => failure(error.code),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
      );
    } catch {
      failure(2);
    }
  }

  // Les callbacks du navigateur ne sont pas annulables : invalider leur génération.
  stop(): void {
    ++this.generation;
    this.pending.set(false);
    this.message.set('');
  }

  clear(): void {
    this.stop();
    this.value.set(undefined);
  }
}
