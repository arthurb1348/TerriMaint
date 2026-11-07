import { describe, expect, it } from 'vitest';
import { IncidentLocation, validCoordinates } from './incident-location';

describe('Localisation ponctuelle', () => {
  function setup() {
    const requests: {
      success: PositionCallback;
      error: PositionErrorCallback | null | undefined;
    }[] = [];
    const geo = {
      getCurrentPosition: (success: PositionCallback, error?: PositionErrorCallback | null) =>
        requests.push({ success, error }),
    } as unknown as Geolocation;
    const location = new IncidentLocation();
    return { location, geo, requests };
  }
  const position = {
    coords: { latitude: 48.25, longitude: -1.5, accuracy: 12 },
  } as GeolocationPosition;
  it('attend, reçoit et retire les coordonnées', () => {
    const { location, geo, requests } = setup();
    location.request(geo, () => true);
    expect(location.pending()).toBe(true);
    requests[0].success(position);
    expect(location.pending()).toBe(false);
    expect(location.value()).toEqual({ latitude: 48.25, longitude: -1.5, accuracy: 12 });
    location.clear();
    expect(location.value()).toBeUndefined();
  });
  it.each([
    [1, 'refusée'],
    [2, 'indisponible'],
    [3, 'dépassé'],
  ] as const)('présente l’erreur %s et permet de réessayer', (code, label) => {
    const { location, geo, requests } = setup();
    location.request(geo, () => true);
    requests[0].error!({ code } as GeolocationPositionError);
    expect(location.message()).toContain(label);
    expect(location.pending()).toBe(false);
    location.request(geo, () => true);
    requests[1].success(position);
    expect(location.value()).toBeDefined();
  });
  it('gère une API absente', () => {
    const { location } = setup();
    location.request(undefined, () => true);
    expect(location.message()).toContain('pas disponible');
    expect(location.pending()).toBe(false);
  });
  it.each(['clear', 'stop', 'new', 'route'] as const)(
    'ignore les réponses tardives après %s',
    (action) => {
      const { location, geo, requests } = setup();
      let current = true;
      location.request(geo, () => current);
      if (action === 'new') location.request(geo, () => true);
      else if (action === 'route') current = false;
      else location[action]();
      requests[0].success(position);
      requests[0].error!({ code: 1 } as GeolocationPositionError);
      expect(location.value()).toBeUndefined();
      if (action === 'new') {
        expect(location.pending()).toBe(true);
        requests[1].success(position);
        expect(location.value()).toBeDefined();
      }
    },
  );
  it('valide les bornes, nombres finis et précision facultative', () => {
    expect(validCoordinates({ latitude: 90, longitude: -180 })).toBe(true);
    for (const value of [
      { latitude: 91, longitude: 0 },
      { latitude: 0, longitude: Infinity },
      { latitude: NaN, longitude: 0 },
      { latitude: 0, longitude: 0, accuracy: -1 },
    ])
      expect(validCoordinates(value)).toBe(false);
  });
});
