import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../app.routes';
import { DemoData } from '../../core/demo-data';
import { DEMO_INCIDENTS } from '../incidents/incidents-demo';
import { DEMO_INTERVENTIONS } from '../interventions/interventions-demo';
import { localToday } from '../interventions/planning-date';
import { Incident } from '../incidents/incident';
import { Responsable } from './responsable';

describe('Tableau de bord Responsable', () => {
  let harness: RouterTestingHarness;
  let data: DemoData;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
    harness = await RouterTestingHarness.create();
    data = TestBed.inject(DemoData);
  });
  afterEach(() => {
    harness.fixture.destroy();
    vi.restoreAllMocks();
  });
  const content = (): HTMLElement => harness.routeNativeElement!;
  const counts = () =>
    Array.from(content().querySelectorAll('.indicator-count'), (item) => Number(item.textContent));
  const references = (id: string) =>
    Array.from(content().querySelectorAll(`[aria-labelledby="${id}"] .reference`), (item) =>
      item.textContent?.trim(),
    );

  it.each([
    [0, '/responsable/incidents?status=open', 2],
    [1, '/responsable/incidents?priority=urgent&status=not-closed', 1],
    [2, '/responsable/interventions?status=planned', 2],
  ] as const)(
    'relie le compteur %s à son total et conserve les filtres au retour',
    async (index, href, count) => {
      await harness.navigateByUrl('/responsable', Responsable);
      const links = content().querySelectorAll<HTMLAnchorElement>('.indicators a');
      expect(links[index].getAttribute('href')).toBe(href);
      expect(counts()[index]).toBe(count);
      links[index].click();
      await harness.fixture.whenStable();
      expect(content().querySelectorAll('tbody tr')).toHaveLength(count);
      content().querySelector<HTMLAnchorElement>('tbody a')!.click();
      await harness.fixture.whenStable();
      expect(content().querySelector('.back-link')?.getAttribute('href')).toBe(href);
      content().querySelector<HTMLAnchorElement>('.back-link')!.click();
      await harness.fixture.whenStable();
      expect(content().querySelectorAll('tbody tr')).toHaveLength(count);
      if (index === 1)
        expect(content().querySelector<HTMLSelectElement>('#incident-status-filter')?.value).toBe(
          'not-closed',
        );
    },
  );

  it('actualise les trois compteurs après déclaration, programmation puis clôture', async () => {
    await harness.navigateByUrl('/responsable', Responsable);
    expect(counts()).toEqual([2, 1, 2]);
    const incident = data.createIncident({
      equipmentId: 'EQ-OUT-0001',
      title: 'Urgence nouvelle',
      description: '',
      priority: 'urgent',
      risk: false,
      photos: [],
    })!;
    await harness.fixture.whenStable();
    expect(counts()).toEqual([3, 2, 2]);
    const intervention = data.createIntervention({
      incidentId: incident.id,
      title: 'Contrôle',
      instructions: '',
      agentId: 'AG-DEMO-001',
      plannedOn: localToday(),
    });
    expect(intervention).toBeDefined();
    await harness.fixture.whenStable();
    expect(counts()).toEqual([3, 2, 3]);
    expect(data.closeIncident(incident.id)).toBe(true);
    await harness.fixture.whenStable();
    expect(counts()).toEqual([2, 1, 3]);
  });

  it('retire la teinte à zéro puis la rétablit après une déclaration dans la même session', async () => {
    await harness.navigateByUrl('/responsable', Responsable);
    const links = () => content().querySelectorAll<HTMLAnchorElement>('.indicators a');
    const urgent = () => links()[1];
    expect(counts()[1]).toBe(1);
    expect(urgent().classList.contains('urgent-indicator')).toBe(true);
    expect(data.closeIncident('INC-2026-046')).toBe(true);
    await harness.fixture.whenStable();
    expect(counts()[1]).toBe(0);
    expect(urgent().classList.contains('urgent-indicator')).toBe(false);
    expect(urgent().getAttribute('href')).toBe(
      '/responsable/incidents?priority=urgent&status=not-closed',
    );
    data.createIncident({
      equipmentId: 'EQ-OUT-0001', title: 'Nouvelle urgence', description: '',
      priority: 'urgent', risk: false, photos: [],
    });
    await harness.fixture.whenStable();
    expect(counts()[1]).toBe(1);
    expect(urgent().classList.contains('urgent-indicator')).toBe(true);
    expect(links()[0].classList.contains('urgent-indicator')).toBe(false);
    expect(links()[2].classList.contains('urgent-indicator')).toBe(false);
  });

  it('présente les états vides et les vrais zéros avec des liens utilisables', async () => {
    vi.spyOn(data, 'incidents').mockReturnValue([]);
    vi.spyOn(data, 'interventions').mockReturnValue([]);
    await harness.navigateByUrl('/responsable', Responsable);
    expect(counts()).toEqual([0, 0, 0]);
    expect(content().textContent).toContain('Aucun signalement à traiter');
    expect(content().textContent).toContain('Aucune intervention planifiée');
    expect(content().querySelectorAll('.indicators a[href]')).toHaveLength(3);
    expect(content().querySelectorAll('.preview-list')).toHaveLength(0);
  });

  function incident(
    id: string,
    priority: Incident['priority'],
    reportedOn: string,
    status: Incident['status'] = 'open',
  ): Incident {
    return { ...DEMO_INCIDENTS[0], id, priority, reportedOn, status };
  }
  it('ordonne Urgente, Haute, Basse sans donner la priorité à une date plus récente', async () => {
    vi.spyOn(data, 'incidents').mockReturnValue([
      incident('LOW', 'low', '2027-01-01'),
      incident('HIGH', 'high', '2026-11-01'),
      incident('URGENT', 'urgent', '2025-01-01'),
    ]);
    await harness.navigateByUrl('/responsable', Responsable);
    expect(references('dashboard-incidents-title')).toEqual(['URGENT', 'HIGH', 'LOW']);
  });
  it('départage par date décroissante puis identifiant, borne à trois et exclut les clôturés', async () => {
    const items = [
      incident('U-OLD', 'urgent', '2026-10-01'),
      incident('U-B', 'urgent', '2026-11-02', 'in-progress'),
      incident('CLOSED', 'urgent', '2027-01-01', 'closed'),
      incident('U-A', 'urgent', '2026-11-02'),
    ];
    vi.spyOn(data, 'incidents').mockReturnValue(items);
    await harness.navigateByUrl('/responsable', Responsable);
    expect(references('dashboard-incidents-title')).toEqual(['U-A', 'U-B', 'U-OLD']);
    expect(counts()[1]).toBe(3);
    expect(items.map((item) => item.id)).toEqual(['U-OLD', 'U-B', 'CLOSED', 'U-A']);
  });
  it('ordonne les planifiées par date croissante puis identifiant, sans exclure les dates passées', async () => {
    const sample = DEMO_INTERVENTIONS[0];
    const items = [
      { ...sample, id: 'B', plannedOn: '2026-11-01' },
      { ...sample, id: 'A', plannedOn: '2026-11-01' },
      { ...sample, id: 'C', plannedOn: '2025-01-01' },
      { ...sample, id: 'LATER', plannedOn: '2027-01-01' },
      { ...sample, id: 'DONE', status: 'completed' as const, plannedOn: '2024-01-01' },
    ];
    vi.spyOn(data, 'interventions').mockReturnValue(items);
    await harness.navigateByUrl('/responsable', Responsable);
    expect(references('dashboard-interventions-title')).toEqual(['C', 'A', 'B']);
    expect(counts()[2]).toBe(4);
    expect(items.map((item) => item.id)).toEqual(['B', 'A', 'C', 'LATER', 'DONE']);
    expect(content().querySelectorAll('.preview-list a a, .preview-list a button')).toHaveLength(0);
  });
});
