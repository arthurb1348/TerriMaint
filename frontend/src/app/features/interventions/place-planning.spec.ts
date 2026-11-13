import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../app.routes';
import { DemoData } from '../../core/demo-data';
import { Incident } from '../incidents/incident';
import { IncidentDetail } from '../incidents/incident-detail';
import { InterventionDetail } from './intervention-detail';
import { InterventionPlanning } from './intervention-planning';
import { localToday } from './planning-date';

const place = '  Rue des Écoles, entrée nord  ';
describe('Programmation sur le lieu du signalement', () => {
  let harness: RouterTestingHarness;
  let data: DemoData;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
    harness = await RouterTestingHarness.create();
    document.body.appendChild(harness.fixture.nativeElement);
    data = TestBed.inject(DemoData);
  });
  afterEach(() => {
    harness.fixture.nativeElement.remove();
    harness.fixture.destroy();
    vi.restoreAllMocks();
  });
  const content = () => harness.routeNativeElement!;
  const create = () =>
    data.createIncident({
      place,
      title: 'Barrière',
      description: '',
      priority: 'urgent',
      risk: false,
      photos: [],
    })!;
  async function click(text: string) {
    Array.from(content().querySelectorAll<HTMLButtonElement | HTMLAnchorElement>('button,a'))
      .find((node) => node.textContent?.replace('←', '').trim() === text)!
      .click();
    await harness.fixture.whenStable();
  }
  async function fill() {
    for (const [id, value] of [
      ['title', 'Réparer la barrière'],
      ['agent', 'AG-DEMO-001'],
      ['date', localToday()],
    ]) {
      const input = content().querySelector<HTMLInputElement>(`#planning-${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event(id === 'agent' ? 'change' : 'input'));
    }
    await harness.fixture.whenStable();
  }
  it.each(['open', 'in-progress'] as const)(
    'programme un signalement %s, garde son statut, ouvre la fiche puis revient avec ses filtres',
    async (status) => {
      const source = create();
      const incident = { ...source, status };
      const getIncident = data.getIncident.bind(data);
      vi.spyOn(data, 'getIncident').mockImplementation((id) =>
        id === source.id ? incident : getIncident(id),
      );
      const origin = `/responsable/incidents/${source.id}?q=%20%20%C3%89COLES%20%20&priority=urgent&status=not-closed`;
      await harness.navigateByUrl(origin, IncidentDetail);
      await click('Programmer une intervention');
      expect(content().querySelector('.origin-summary')?.textContent).toContain(place);
      await fill();
      await click('Vérifier l’intervention');
      expect(content().querySelector('.origin-summary')?.textContent).toContain(place);
      await click('Programmer l’intervention');
      expect(data.interventions().at(-1)).toMatchObject({
        incidentId: source.id,
        status: 'planned',
        agentId: 'AG-DEMO-001',
      });
      expect(data.getIncident(source.id)).toBe(incident);
      await click('Voir l’intervention');
      expect(content().querySelector('h1')?.textContent).toBe('Réparer la barrière');
      expect(content().querySelector('.place-summary')?.textContent).toContain(place);
      expect(content().querySelector('.equipment-summary')).toBeNull();
      expect(content().textContent).not.toContain('Matériel introuvable');
      await click('Voir le signalement');
      expect(TestBed.inject(Router).url).toBe(origin);
      expect(content().querySelector('.related-interventions')?.textContent).toContain(
        'Réparer la barrière',
      );
      const created = data.interventions().at(-1)!;
      await harness.navigateByUrl(`/agent/interventions/${created.id}`, InterventionDetail);
      expect(content().querySelector('.place-summary')?.textContent).toContain(place);
      expect(content().querySelector('.equipment-summary')).toBeNull();
    },
  );
  it.each([
    { place: ' ', equipmentId: undefined },
    { place, equipmentId: 'EQ-OUT-0001' },
    { place: undefined, equipmentId: undefined },
    { place: undefined, equipmentId: 'inconnu' },
  ])('refuse une origine incohérente en URL directe : %j', async (origin) => {
    const source = { ...create(), ...origin } as Incident;
    vi.spyOn(data, 'getIncident').mockReturnValue(source);
    const before = data.interventions();
    const createIntervention = vi.spyOn(data, 'createIntervention');
    await harness.navigateByUrl(
      `/responsable/interventions/nouvelle/${source.id}`,
      InterventionPlanning,
    );
    expect(content().querySelector('form')).toBeNull();
    expect(content().querySelector('.origin-summary')).toBeNull();
    const component = harness.routeDebugElement!.componentInstance as {
      review(): void;
      complete(): void;
    };
    component.review();
    component.complete();
    expect(createIntervention).not.toHaveBeenCalled();
    expect(data.interventions()).toBe(before);
  });
  it('refuse la confirmation si le signalement est clôturé pendant le récapitulatif', async () => {
    const source = create();
    await harness.navigateByUrl(
      `/responsable/interventions/nouvelle/${source.id}`,
      InterventionPlanning,
    );
    await fill();
    await click('Vérifier l’intervention');
    const before = data.interventions();
    data.closeIncident(source.id);
    await harness.fixture.whenStable();
    expect(content().querySelector('h1')?.textContent).toBe('Signalement clôturé');
    const createIntervention = vi.spyOn(data, 'createIntervention');
    (harness.routeDebugElement!.componentInstance as { complete(): void }).complete();
    expect(createIntervention).not.toHaveBeenCalled();
    expect(data.interventions()).toBe(before);
  });
});
