import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../app.routes';
import { DemoData } from '../../core/demo-data';
import { Responsable } from '../responsable/responsable';
import { InterventionPlanning } from '../interventions/intervention-planning';
import { IncidentDeclaration } from './incident-declaration';
import { IncidentDetail } from './incident-detail';
import { Incidents } from './incidents';

describe('Signalement sans équipement', () => {
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
    vi.restoreAllMocks();
  });
  const content = () => harness.routeNativeElement!;
  async function enter(name: string, value: string) {
    const control = content().querySelector<HTMLInputElement>(`#incident-${name}`)!;
    control.value = value;
    control.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
  }
  async function click(text: string) {
    Array.from(content().querySelectorAll<HTMLButtonElement | HTMLAnchorElement>('a,button'))
      .find((node) => node.textContent?.replace('←', '').trim() === text)!
      .click();
    await harness.fixture.whenStable();
  }
  async function choosePriority() {
    content().querySelector<HTMLInputElement>('#priority-urgent')!.click();
    await harness.fixture.whenStable();
  }

  it.each(['agent', 'responsable'])('ouvre le formulaire de %s avant le détail et conserve les filtres à l’annulation', async (space) => {
    await harness.navigateByUrl(`/${space}/incidents?q=écoles&priority=urgent&status=open`, Incidents);
    await click('Nouveau signalement');
    expect(content().querySelector('h1')?.textContent?.trim()).toBe('Nouveau signalement');
    expect(content().querySelector('form')).not.toBeNull();
    expect(content().querySelector('.equipment-summary')).toBeNull();
    expect(content().querySelector('[aria-labelledby="location-heading"]')?.textContent).not.toContain('matériel');
    await enter('place', 'Rue des Écoles');
    await click('Retour aux signalements');
    expect(TestBed.inject(Router).url).toBe(
      `/${space}/incidents?q=%C3%A9coles&priority=urgent&status=open`,
    );
    await harness.navigateByUrl(`/${space}/incidents/nouveau`, IncidentDeclaration);
    expect(content().querySelector('form')).not.toBeNull();
  });

  it.each(['', '   ', 'x'.repeat(201)])(
    'refuse un lieu invalide même si les autres champs sont valides : %j',
    async (place) => {
      await harness.navigateByUrl('/agent/incidents/nouveau', IncidentDeclaration);
      await enter('title', 'Barrière endommagée');
      await choosePriority();
      await enter('place', place);
      const before = TestBed.inject(DemoData).incidents();
      await click('Vérifier le signalement');
      const control = content().querySelector('#incident-place');
      expect(control?.getAttribute('aria-invalid')).toBe('true');
      expect(control?.getAttribute('aria-describedby')).toBe('place-help place-error');
      expect(document.activeElement).toBe(control);
      expect(content().querySelector('#place-error')?.textContent).toContain(
        'pas seulement des espaces',
      );
      expect(TestBed.inject(DemoData).incidents()).toBe(before);
    },
  );

  it('garde l’intitulé et la priorité obligatoires après un lieu valide', async () => {
    await harness.navigateByUrl('/agent/incidents/nouveau', IncidentDeclaration);
    await enter('place', 'Rue des Écoles');
    await click('Vérifier le signalement');
    expect(document.activeElement?.id).toBe('incident-title');
    await enter('title', 'Barrière endommagée');
    await click('Vérifier le signalement');
    expect(document.activeElement?.id).toBe('priority-low');
    expect(content().querySelector('#priority-error')).not.toBeNull();
  });

  it('conserve la saisie à Modifier, publie dans les deux espaces, recherche le lieu et clôture sans matériel', async () => {
    await harness.navigateByUrl('/agent/incidents/nouveau', IncidentDeclaration);
    const data = TestBed.inject(DemoData);
    const count = data.incidents().length;
    await enter('place', '  Rue des Écoles, près du portail  ');
    await enter('title', 'Barrière endommagée');
    await choosePriority();
    await click('Vérifier le signalement');
    expect(content().querySelector('.review-values')?.textContent).toContain(
      'Rue des Écoles, près du portail',
    );
    expect(content().textContent).toContain('Aucune localisation ajoutée.');
    expect(data.incidents()).toHaveLength(count);
    await click('Modifier le signalement');
    expect(content().querySelector<HTMLInputElement>('#incident-place')?.value).toBe(
      '  Rue des Écoles, près du portail  ',
    );
    await click('Vérifier le signalement');
    await click('Envoyer le signalement');
    expect(data.incidents()).toHaveLength(count + 1);
    const created = data.incidents().at(-1)!;
    expect(created.equipmentId).toBeUndefined();
    expect(created.status).toBe('open');
    expect(content().querySelector('.return-link')?.getAttribute('href')).toBe('/agent/incidents');
    await click('Voir le signalement');
    expect(content().querySelector('.place-summary')?.textContent).toContain(created.place);
    expect(content().querySelector('.equipment-summary')).toBeNull();
    expect(content().querySelector('app-incident-map button')).toBeNull();
    expect(content().querySelector('#incident-close-action')).toBeNull();
    for (const space of ['agent', 'responsable']) {
      await harness.navigateByUrl(`/${space}/incidents?q=  ÉCOLES  `, Incidents);
      expect(content().querySelectorAll('tbody tr')).toHaveLength(1);
      expect(content().querySelector('tbody')?.textContent).toContain(created.place);
      expect(content().textContent).not.toContain('Matériel introuvable');
    }
    await harness.navigateByUrl('/responsable', Responsable);
    expect(
      content().querySelector('#dashboard-incidents-title')?.parentElement?.textContent,
    ).toContain(created.place);
    await harness.navigateByUrl(`/responsable/incidents/${created.id}`, IncidentDetail);
    expect(content().querySelector('.planning-link')).not.toBeNull();
    await click('Clôturer le signalement');
    await click('Annuler');
    expect(data.getIncident(created.id)?.status).toBe('open');
    await click('Clôturer le signalement');
    await click('Clôturer le signalement');
    expect(data.getIncident(created.id)?.status).toBe('closed');
    expect(content().querySelector('.metadata')?.textContent).toContain('Clôturé');
    await harness.navigateByUrl(
      `/responsable/interventions/nouvelle/${created.id}`,
      InterventionPlanning,
    );
    expect(content().querySelector('h1')?.textContent).toBe(
      'Signalement clôturé',
    );
    expect(content().querySelector('form')).toBeNull();
    await harness.navigateByUrl(`/agent/incidents/${created.id}`, IncidentDetail);
    expect(content().querySelector('.metadata')?.textContent).toContain('Clôturé');
  });

  it('ne transforme jamais un équipement inconnu en formulaire sur un lieu', async () => {
    await harness.navigateByUrl('/agent/incidents/nouveau/absent', IncidentDeclaration);
    expect(content().querySelector('h1')?.textContent).toBe('Équipement introuvable');
    expect(content().querySelector('form')).toBeNull();
    await harness.navigateByUrl('/agent/incidents/nouveau', IncidentDeclaration);
    await enter('place', 'Ancien lieu');
    await enter('title', 'Ancien titre');
    await harness.navigateByUrl(
      '/agent/incidents/nouveau/EQ-OUT-0001?q=tondeuse',
      IncidentDeclaration,
    );
    expect(content().querySelector('#incident-place')).toBeNull();
    expect(content().querySelector<HTMLInputElement>('#incident-title')?.value).toBe('');
    expect(content().querySelector('.back-link')?.getAttribute('href')).toBe(
      '/agent/equipements/EQ-OUT-0001?q=tondeuse',
    );
    await harness.navigateByUrl('/agent/incidents/nouveau', IncidentDeclaration);
    expect(content().querySelector<HTMLInputElement>('#incident-place')?.value).toBe('');
  });
});
