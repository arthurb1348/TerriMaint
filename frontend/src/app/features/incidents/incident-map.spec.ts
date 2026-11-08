import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../app.routes';
import { DemoData } from '../../core/demo-data';
import { IncidentDetail } from './incident-detail';
import { IncidentMap } from './incident-map';

const renderer = vi.hoisted(() => ({
  map: vi.fn(),
  marker: vi.fn(),
  icon: vi.fn(),
  tileLayer: vi.fn(),
}));
vi.mock('leaflet/dist/leaflet-src.esm.js', () => renderer);

describe('Carte de la fiche partagée', () => {
  let harness: RouterTestingHarness;
  let remove: ReturnType<typeof vi.fn>;
  let events: Record<string, () => void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    events = {};
    remove = vi.fn();
    renderer.map.mockReturnValue({ remove });
    renderer.marker.mockReturnValue({ addTo: vi.fn() });
    renderer.tileLayer.mockReturnValue({
      on: vi.fn((event: string, callback: () => void) => {
        events[event] = callback;
      }),
      addTo: vi.fn(),
    });
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    harness.fixture.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const section = () => harness.routeNativeElement!.querySelector('app-incident-map')!;
  const action = () => section().querySelector<HTMLButtonElement>('button')!;
  async function click() {
    action().click();
    harness.detectChanges();
    await harness.fixture.whenStable();
    await vi.dynamicImportSettled();
    harness.detectChanges();
  }

  it.each(['agent', 'responsable'])(
    'affiche le point joint dans %s seulement au clic',
    async (space) => {
      await harness.navigateByUrl(`/${space}/incidents/INC-2026-045`, IncidentDetail);
      const summary = harness.routeNativeElement!.querySelector('app-location-summary')!;
      expect(summary.textContent).toContain('48.25');
      expect(summary.textContent).toContain('-1.5');
      expect(action().textContent).toContain('Afficher la carte');
      expect(action().getAttribute('aria-expanded')).toBe('false');
      expect(renderer.map).not.toHaveBeenCalled();
      expect(renderer.tileLayer).not.toHaveBeenCalled();
      await click();
      expect(renderer.map).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ center: [48.25, -1.5], zoom: 16, keyboard: false }),
      );
      expect(renderer.marker).toHaveBeenCalledWith(
        [48.25, -1.5],
        expect.objectContaining({ alt: 'Position jointe au signalement' }),
      );
      expect(renderer.tileLayer).toHaveBeenCalledWith(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        expect.objectContaining({ referrerPolicy: 'strict-origin', keepBuffer: 0 }),
      );
      events['load']();
      harness.detectChanges();
      expect(section().textContent).toContain('Carte centrée');
      expect(summary.textContent).toContain('48.25');
      await click();
      expect(remove).toHaveBeenCalledOnce();
      expect(action().getAttribute('aria-expanded')).toBe('false');
    },
  );

  it.each(['agent', 'responsable'])(
    'sans position dans %s, ne propose ni carte ni chargement',
    async (space) => {
      await harness.navigateByUrl(`/${space}/incidents/INC-2026-046`, IncidentDetail);
      expect(
        harness.routeNativeElement!.querySelector('app-location-summary')?.textContent,
      ).toContain('Aucune localisation ajoutée.');
      expect(section().querySelector('button')).toBeNull();
      expect(section().querySelector('.map-canvas')).toBeNull();
      expect(renderer.map).not.toHaveBeenCalled();
      expect(renderer.tileLayer).not.toHaveBeenCalled();
    },
  );

  it('garde le résumé et les autres actions en cas d’échec, puis permet de réessayer', async () => {
    await harness.navigateByUrl('/responsable/incidents/INC-2026-045', IncidentDetail);
    await click();
    events['tileerror']();
    await Promise.resolve();
    events['load']();
    harness.detectChanges();
    expect(section().textContent).toContain('Le fond de carte est indisponible.');
    expect(action().textContent).toContain('Réessayer la carte');
    expect(
      harness.routeNativeElement!.querySelector('app-location-summary')?.textContent,
    ).toContain('48.25');
    expect(harness.routeNativeElement!.querySelector('.planning-link')).not.toBeNull();
    expect(remove).toHaveBeenCalledOnce();
    await click();
    events['load']();
    harness.detectChanges();
    expect(section().textContent).toContain('Carte centrée');
    expect(renderer.map).toHaveBeenCalledTimes(2);
  });

  it('borne l’attente à dix secondes et ignore un succès tardif', async () => {
    await harness.navigateByUrl('/agent/incidents/INC-2026-045', IncidentDetail);
    vi.useFakeTimers();
    await click();
    await vi.advanceTimersByTimeAsync(10_000);
    events['load']();
    harness.detectChanges();
    expect(section().textContent).toContain('Le fond de carte est indisponible.');
    expect(remove).toHaveBeenCalledOnce();
  });

  it('présente aussi le repli si le moteur ne peut pas initialiser la carte', async () => {
    renderer.map.mockImplementationOnce(() => {
      throw new Error('Renderer unavailable');
    });
    await harness.navigateByUrl('/agent/incidents/INC-2026-045', IncidentDetail);
    await click();
    expect(section().textContent).toContain('Le fond de carte est indisponible.');
    expect(renderer.tileLayer).not.toHaveBeenCalled();
  });

  it.each(['agent', 'responsable'])(
    'réinitialise les mêmes instances réutilisées dans %s et ignore les événements anciens',
    async (space) => {
      const data = TestBed.inject(DemoData);
      const created = data.createIncident({
        equipmentId: 'EQ-OUT-0001',
        title: 'Autre position',
        description: '',
        priority: 'low',
        risk: false,
        photos: [],
        coordinates: { latitude: 47.1, longitude: 2.2 },
      })!;
      const first = await harness.navigateByUrl(`/${space}/incidents/INC-2026-045`, IncidentDetail);
      const child = harness.routeDebugElement!.query(By.directive(IncidentMap)).componentInstance;
      await click();
      const oldEvents = { ...events };
      expect(await harness.navigateByUrl(`/${space}/incidents/${created.id}`, IncidentDetail)).toBe(
        first,
      );
      expect(harness.routeDebugElement!.query(By.directive(IncidentMap)).componentInstance).toBe(
        child,
      );
      oldEvents['load']();
      oldEvents['tileerror']();
      await Promise.resolve();
      harness.detectChanges();
      expect(action().getAttribute('aria-expanded')).toBe('false');
      expect(remove).toHaveBeenCalledOnce();
      expect(section().textContent).not.toContain('indisponible');
      await click();
      expect(renderer.marker).toHaveBeenLastCalledWith([47.1, 2.2], expect.anything());
      await harness.navigateByUrl(`/${space}/incidents/INC-2026-046`, IncidentDetail);
      expect(section().querySelector('button')).toBeNull();
      await harness.navigateByUrl(`/${space}/incidents/INC-2026-045`, IncidentDetail);
      expect(action().getAttribute('aria-expanded')).toBe('false');
      expect(renderer.map).toHaveBeenCalledTimes(2);
    },
  );

  it('efface l’erreur au changement de fiche et détruit la carte au départ', async () => {
    await harness.navigateByUrl('/agent/incidents/INC-2026-045', IncidentDetail);
    await click();
    events['tileerror']();
    await Promise.resolve();
    await harness.navigateByUrl('/agent/incidents/INC-2026-046', IncidentDetail);
    await harness.navigateByUrl('/agent/incidents/INC-2026-045', IncidentDetail);
    expect(action().textContent).toContain('Afficher la carte');
    await click();
    await harness.navigateByUrl('/agent');
    expect(remove).toHaveBeenCalledTimes(2);
  });
});
