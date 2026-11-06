import { signal } from '@angular/core';
import { DemoData } from '../../core/demo-data';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { routes } from '../../app.routes';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { DEMO_INCIDENTS } from '../incidents/incidents-demo';
import { DEMO_AGENTS } from './agents-demo';
import { Interventions } from './interventions';
import { DEMO_INTERVENTIONS } from './interventions-demo';

describe('Consultation locale des interventions', () => {
  const base = '/responsable/interventions';
  let harness: RouterTestingHarness;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
    harness = await RouterTestingHarness.create();
    document.body.appendChild(harness.fixture.nativeElement);
  });
  afterEach(() => {
    harness.fixture.nativeElement.remove();
    harness.fixture.destroy();
  });
  function content(): HTMLElement {
    return harness.routeNativeElement!;
  }
  function rows(): HTMLTableRowElement[] {
    return Array.from(content().querySelectorAll('tbody tr'));
  }
  async function change(id: string, value: string): Promise<void> {
    const control = content().querySelector<HTMLInputElement | HTMLSelectElement>(
      `#intervention-${id}`,
    )!;
    control.value = value;
    control.dispatchEvent(new Event(control.tagName === 'INPUT' ? 'input' : 'change'));
    await harness.fixture.whenStable();
  }

  it('relie six références uniques aux sources existantes, couvre les trois statuts et des consignes absentes', () => {
    expect(DEMO_INTERVENTIONS).toHaveLength(6);
    expect(new Set(DEMO_INTERVENTIONS.map((item) => item.id)).size).toBe(6);
    for (const item of DEMO_INTERVENTIONS) {
      expect(item.id).toMatch(/^INT-/);
      const incident = DEMO_INCIDENTS.find((source) => source.id === item.incidentId);
      expect(incident).toBeDefined();
      expect(DEMO_EQUIPMENT.some((source) => source.id === incident?.equipmentId)).toBe(true);
      expect(DEMO_AGENTS.some((source) => source.id === item.agentId)).toBe(true);
      expect(item.plannedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(new Set(DEMO_INTERVENTIONS.map((item) => item.status))).toEqual(
      new Set(['planned', 'in-progress', 'completed']),
    );
    expect(DEMO_INTERVENTIONS.some((item) => !item.instructions?.trim())).toBe(true);
  });

  it('affiche les informations de chaque relation, les effectifs réels et les dates calendaires', async () => {
    await harness.navigateByUrl(base, Interventions);
    expect(rows()).toHaveLength(6);
    expect(content().textContent).not.toContain('Données de démonstration');
    expect(content().querySelector('[role="status"]')?.textContent?.trim()).toBe(
      '6 interventions trouvées sur 6.',
    );
    const counts = Array.from(content().querySelectorAll('.status-counts dd'), (cell) =>
      Number(cell.textContent),
    );
    expect(counts).toEqual(
      ['planned', 'in-progress', 'completed'].map(
        (status) => DEMO_INTERVENTIONS.filter((item) => item.status === status).length,
      ),
    );
    for (const [index, item] of DEMO_INTERVENTIONS.entries()) {
      const incident = DEMO_INCIDENTS.find((source) => source.id === item.incidentId)!;
      const equipment = DEMO_EQUIPMENT.find((source) => source.id === incident.equipmentId)!;
      const agent = DEMO_AGENTS.find((source) => source.id === item.agentId)!;
      expect(rows()[index].textContent).toContain(equipment.name);
      expect(rows()[index].textContent).toContain(equipment.id);
      expect(rows()[index].textContent).toContain(agent.name);
      expect(rows()[index].querySelector('a')?.getAttribute('href')).toBe(`${base}/${item.id}`);
      expect(rows()[index].querySelector('time')?.getAttribute('datetime')).toBe(item.plannedOn);
      expect(rows()[index].querySelector('time')?.textContent).toBe(
        item.plannedOn.split('-').reverse().join('/'),
      );
    }
    expect(content().textContent).not.toMatch(/Disponible|Synchronisé|Notification/);
  });

  it.each([
    ['  aLIMENTATION  ', 'INT-2026-032'],
    ['  int-2026-035  ', 'INT-2026-035'],
    ['  tONDEUSE  ', 'INT-2026-035'],
    ['  eq-veh-0042  ', 'INT-2026-033'],
  ])('recherche %j par titre/référence/nom/id matériel sans changer la saisie', async (q, id) => {
    await harness.navigateByUrl(`${base}?${new URLSearchParams({ q })}`, Interventions);
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain(id);
    expect(content().querySelector<HTMLInputElement>('input')!.value).toBe(q);
  });

  it.each(['', '   '])('affiche tout pour une recherche %j', async (q) => {
    await harness.navigateByUrl(`${base}?${new URLSearchParams({ q })}`, Interventions);
    expect(rows()).toHaveLength(6);
  });

  it('initialise et suit les trois critères dans une même instance', async () => {
    const first = await harness.navigateByUrl(
      `${base}?q=OUT&status=in-progress&assignee=AG-DEMO-001`,
      Interventions,
    );
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('INT-2026-035');
    expect(content().querySelector<HTMLSelectElement>('#intervention-status-filter')!.value).toBe(
      'in-progress',
    );
    expect(content().querySelector<HTMLSelectElement>('#intervention-assignee-filter')!.value).toBe(
      'AG-DEMO-001',
    );
    expect(
      await harness.navigateByUrl(
        `${base}?q=OUT&status=completed&assignee=AG-DEMO-002`,
        Interventions,
      ),
    ).toBe(first);
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('INT-2026-037');
    expect(content().querySelector<HTMLSelectElement>('#intervention-status-filter')!.value).toBe(
      'completed',
    );
    expect(content().querySelector<HTMLSelectElement>('#intervention-assignee-filter')!.value).toBe(
      'AG-DEMO-002',
    );
  });

  it('combine les filtres, annonce le vide puis réinitialise avec retour du focus sans mutation', async () => {
    const sources = JSON.stringify([
      DEMO_INTERVENTIONS,
      DEMO_INCIDENTS,
      DEMO_EQUIPMENT,
      DEMO_AGENTS,
    ]);
    await harness.navigateByUrl(base, Interventions);
    await change('search', '  EQ-OUT  ');
    expect(rows()).toHaveLength(4);
    await change('status-filter', 'in-progress');
    await change('assignee-filter', 'AG-DEMO-001');
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('INT-2026-035');
    const router = TestBed.inject(Router);
    const query = { q: '  EQ-OUT  ', status: 'in-progress', assignee: 'AG-DEMO-001' };
    expect(router.parseUrl(router.url).queryParams).toEqual(query);
    expect(
      router.parseUrl(rows()[0].querySelector('a')!.getAttribute('href')!).queryParams,
    ).toEqual(query);
    await change('status-filter', 'completed');
    expect(rows()).toHaveLength(0);
    expect(content().textContent).toContain('Aucune intervention ne correspond');
    expect(content().querySelector('[role="status"]')?.textContent?.trim()).toBe(
      '0 intervention trouvée sur 6.',
    );
    content().querySelector('button')!.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe(base);
    expect(rows()).toHaveLength(6);
    expect(document.activeElement).toBe(content().querySelector('input'));
    expect(JSON.stringify([DEMO_INTERVENTIONS, DEMO_INCIDENTS, DEMO_EQUIPMENT, DEMO_AGENTS])).toBe(
      sources,
    );
  });

  it.each(['inconnu', 'toString', '__proto__'])(
    'ignore les filtres inconnus %s et ne propage que les critères reconnus',
    async (value) => {
      await harness.navigateByUrl(
        `${base}?${new URLSearchParams({ q: '  tONDEUSE  ', status: value, assignee: value, priority: 'high' })}`,
        Interventions,
      );
      expect(rows()).toHaveLength(1);
      for (const select of content().querySelectorAll('select')) expect(select.value).toBe('');
      await change('status-filter', 'in-progress');
      expect(TestBed.inject(Router).parseUrl(TestBed.inject(Router).url).queryParams).toEqual({
        q: '  tONDEUSE  ',
        status: 'in-progress',
      });
    },
  );
  it('limite la liste Agent à Camille malgré assignee, conserve recherche/statut et distingue les vides', async () => {
    await harness.navigateByUrl('/agent/interventions?assignee=AG-DEMO-002', Interventions);
    expect(rows()).toHaveLength(2);
    expect(content().querySelector('h1')?.textContent).toBe('Mes interventions');
    expect(content().querySelector('#intervention-assignee-filter')).toBeNull();
    expect(content().textContent).not.toContain('Alex Martin');
    await change('search', 'Tondeuse');
    await change('status-filter', 'in-progress');
    expect(rows()).toHaveLength(1);
    expect(rows()[0].querySelector('a')?.getAttribute('href')).toBe(
      '/agent/interventions/INT-2026-035?q=Tondeuse&status=in-progress',
    );
    expect(TestBed.inject(Router).url).not.toContain('assignee');
    await change('status-filter', 'completed');
    expect(content().textContent).toContain('Aucune intervention ne correspond');
    expect(content().textContent).not.toContain('Aucune intervention ne vous est assignée');
    const interventions = signal(
      DEMO_INTERVENTIONS.map((item) => ({ ...item, agentId: 'AG-DEMO-002' })),
    );
    Object.defineProperty(TestBed.inject(DemoData), 'interventions', {
      value: interventions.asReadonly(),
    });
    // Une nouvelle instance lit cette source vide pour Camille, sans modifier les données de départ.
    await harness.navigateByUrl('/agent');
    await harness.navigateByUrl('/agent/interventions', Interventions);
    expect(content().textContent).toContain('Aucune intervention ne vous est assignée');
    interventions.set(DEMO_INTERVENTIONS.map((item) => ({ ...item, agentId: 'AG-DEMO-001' })));
    harness.detectChanges();
    expect(rows()).toHaveLength(6);
    await change('status-filter', 'completed');
    expect(rows()).toHaveLength(2);
  });
});
