import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoData } from '../../core/demo-data';
import { routes } from '../../app.routes';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { DEMO_INCIDENTS } from '../incidents/incidents-demo';
import { DEMO_AGENTS } from './agents-demo';
import { InterventionDetail } from './intervention-detail';
import { Interventions } from './interventions';

describe('Détail local des interventions', () => {
  const base = '/responsable/interventions';
  let harness: RouterTestingHarness;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
    harness = await RouterTestingHarness.create();
  });
  afterEach(() => {
    harness.fixture.destroy();
    vi.restoreAllMocks();
  });
  function content(): HTMLElement {
    return harness.routeNativeElement!;
  }

  it('termine depuis Agent, annonce le résultat et reste sur la fiche avec un focus utile', async () => {
    await harness.navigateByUrl('/agent/interventions/INT-2026-035', InterventionDetail);
    const data = TestBed.inject(DemoData);
    const incidents = data.incidents();
    const router = TestBed.inject(Router);
    const button = content().querySelector<HTMLButtonElement>('button')!;
    expect(button.textContent?.trim()).toBe('Intervention terminée');
    expect(content().querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    button.focus();
    button.click();
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/agent/interventions/INT-2026-035');
    expect(content().querySelector('.badge')?.textContent).toBe('Terminée');
    expect(content().querySelector('button')).toBeNull();
    const feedback = content().querySelector<HTMLElement>('[role="status"]')!;
    expect(feedback.textContent?.trim()).toBe('L’intervention est maintenant terminée.');
    expect(document.activeElement).toBe(feedback);
    expect(data.incidents()).toBe(incidents);
    const after = data.interventions();
    button.click();
    harness.detectChanges();
    expect(data.interventions()).toBe(after);
    expect(feedback.textContent?.trim()).toBe('L’intervention est maintenant terminée.');
  });

  it.each([
    '/responsable/interventions/INT-2026-035',
    '/agent/interventions/INT-2026-032',
    '/agent/interventions/INT-2026-034',
    '/agent/interventions/INT-2026-036',
    '/agent/interventions/absent',
  ])('ne propose pas la transition sur %s', async (url) => {
    await harness.navigateByUrl(url, InterventionDetail);
    expect(content().querySelector('button')).toBeNull();
  });

  it('ne garde pas le message sur une autre fiche et partage le statut avec Responsable', async () => {
    const first = await harness.navigateByUrl(
      '/agent/interventions/INT-2026-035',
      InterventionDetail,
    );
    content().querySelector<HTMLButtonElement>('button')!.click();
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(
      await harness.navigateByUrl('/agent/interventions/INT-2026-032', InterventionDetail),
    ).toBe(first);
    expect(content().querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    expect(content().querySelector('.badge')?.textContent).toBe('Planifiée');
    await harness.navigateByUrl('/responsable/interventions/INT-2026-035', InterventionDetail);
    expect(content().querySelector('.badge')?.textContent).toBe('Terminée');
    expect(content().querySelector('button')).toBeNull();
  });

  it('revalide le statut si un bouton déjà rendu est activé après une mise à jour partagée', async () => {
    await harness.navigateByUrl('/agent/interventions/INT-2026-035', InterventionDetail);
    const button = content().querySelector<HTMLButtonElement>('button')!;
    const data = TestBed.inject(DemoData);
    expect(data.completeAssignedIntervention('INT-2026-035')).toBe(true);
    const after = data.interventions();
    button.click();
    harness.detectChanges();
    expect(data.interventions()).toBe(after);
    expect(content().querySelector('button')).toBeNull();
    expect(content().querySelector('.badge')?.textContent).toBe('Terminée');
  });

  it('lit la même source et lie signalement et matériel Responsable sans aucun filtre', async () => {
    await harness.navigateByUrl(
      `${base}/INT-2026-032?q=OUT&status=planned&assignee=AG-DEMO-001`,
      InterventionDetail,
    );
    expect(content().querySelector('h1')?.textContent).toBe(
      'Diagnostic et remise en état du système d’alimentation',
    );
    expect(content().textContent).not.toContain('Données de démonstration');
    expect(content().textContent).toContain('INT-2026-032');
    expect(content().querySelector('.metadata')?.textContent).toContain('Planifiée');
    expect(content().querySelector('.metadata')?.textContent).toContain('Camille Durand');
    expect(content().querySelector('time')?.getAttribute('datetime')).toBe('2026-11-03');
    expect(content().querySelector('time')?.textContent).toBe('03/11/2026');
    expect(content().querySelector('.instructions')?.textContent).toBe(
      'Contrôler le circuit d’alimentation.\nPréparer les pièces utiles au diagnostic.',
    );
    expect(content().querySelector('.origin-summary')?.textContent).toContain(
      'Moteur qui cale à l’accélération',
    );
    expect(content().querySelector('.origin-summary a')?.getAttribute('href')).toBe(
      '/responsable/incidents/INC-2026-045',
    );
    expect(content().querySelector('.equipment-summary')?.textContent).toContain(
      'Débroussailleuse n°3',
    );
    expect(content().querySelector('.equipment-summary')?.textContent).toContain(
      'Atelier municipal',
    );
    expect(content().querySelector('.equipment-summary a')?.getAttribute('href')).toBe(
      '/responsable/equipements/EQ-OUT-0003',
    );
    expect(content().textContent).not.toMatch(/disponibilité|Synchronisé|Historique|Notification/);
    expect(content().querySelector('button')).toBeNull();
  });

  it('retrouve les critères exacts au retour explicite après accès direct, avec consignes absentes', async () => {
    const query = { q: '  tONDEUSE  ', status: 'in-progress', assignee: 'AG-DEMO-001' };
    await harness.navigateByUrl(
      `${base}/INT-2026-035?${new URLSearchParams(query)}`,
      InterventionDetail,
    );
    expect(content().querySelector('.instructions')?.textContent).toBe('Non renseignées');
    content().querySelector<HTMLAnchorElement>('.back-link')!.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).parseUrl(TestBed.inject(Router).url).queryParams).toEqual(query);
    expect(content().querySelector<HTMLInputElement>('input')!.value).toBe(query.q);
    expect(content().querySelector<HTMLSelectElement>('#intervention-status-filter')!.value).toBe(
      query.status,
    );
    expect(content().querySelector<HTMLSelectElement>('#intervention-assignee-filter')!.value).toBe(
      query.assignee,
    );
    expect(content().querySelectorAll('tbody tr')).toHaveLength(1);
    expect(content().querySelector('tbody')?.textContent).toContain('INT-2026-035');
  });

  it('suit les changements d’id dans la même instance, sans ancienne fiche ni liens résiduels', async () => {
    const first = await harness.navigateByUrl(`${base}/INT-2026-032`, InterventionDetail);
    expect(await harness.navigateByUrl(`${base}/INT-2026-033`, InterventionDetail)).toBe(first);
    expect(content().querySelector('h1')?.textContent).toBe('Contrôle du système de freinage');
    expect(content().textContent).toContain('Samira Bernard');
    expect(content().textContent).not.toContain('Débroussailleuse');
    expect(
      await harness.navigateByUrl(
        `${base}/absent?q=OUT&status=planned&assignee=AG-DEMO-001`,
        InterventionDetail,
      ),
    ).toBe(first);
    expect(content().querySelector('h1')?.textContent).toBe('Intervention introuvable');
    expect(content().querySelector('dl')).toBeNull();
    expect(content().querySelector('.origin')).toBeNull();
    expect(content().querySelector('.instructions')).toBeNull();
    expect(content().querySelectorAll('a')).toHaveLength(1);
    expect(content().querySelector('.back-link')?.getAttribute('href')).toBe(
      `${base}?q=OUT&status=planned&assignee=AG-DEMO-001`,
    );
    expect(await harness.navigateByUrl(`${base}/INT-2026-035`, InterventionDetail)).toBe(first);
    expect(content().querySelector('.instructions')?.textContent).toBe('Non renseignées');
    expect(content().textContent).toContain('Tondeuse autoportée');
    expect(content().textContent).not.toContain('Samira Bernard');
  });

  it('suit les filtres seuls dans le même détail en ignorant les valeurs étrangères', async () => {
    const first = await harness.navigateByUrl(`${base}/INT-2026-032`, InterventionDetail);
    expect(
      await harness.navigateByUrl(
        `${base}/INT-2026-032?q=%20OUT%20&status=toString&assignee=absent&priority=high`,
        InterventionDetail,
      ),
    ).toBe(first);
    expect(content().querySelector('.back-link')?.getAttribute('href')).toBe(`${base}?q=%20OUT%20`);
  });

  it('ouvre le détail depuis la liste filtrée et revient à ses résultats', async () => {
    await harness.navigateByUrl(`${base}?status=completed&assignee=AG-DEMO-003`, Interventions);
    content().querySelector<HTMLAnchorElement>('tbody a')!.click();
    await harness.fixture.whenStable();
    expect(content().querySelector('h1')?.textContent).toBe('Remplacement de la sangle');
    expect(content().querySelector('.metadata')?.textContent).toContain('Terminée');
    content().querySelector<HTMLAnchorElement>('.back-link')!.click();
    await harness.fixture.whenStable();
    expect(content().querySelectorAll('tbody tr')).toHaveLength(1);
    expect(content().querySelector('tbody')?.textContent).toContain('INT-2026-036');
  });

  it.each(['incident', 'equipment', 'agent'])(
    'présente une relation %s manquante sans lien erroné ni exception',
    async (relation) => {
      const source =
        relation === 'incident'
          ? DEMO_INCIDENTS
          : relation === 'equipment'
            ? DEMO_EQUIPMENT
            : DEMO_AGENTS;
      if (relation === 'incident')
        vi.spyOn(TestBed.inject(DemoData), 'getIncident').mockReturnValue(undefined);
      else vi.spyOn(source, 'find').mockReturnValue(undefined);
      await harness.navigateByUrl(`${base}/INT-2026-032`, InterventionDetail);
      const expected =
        relation === 'incident'
          ? 'Signalement introuvable'
          : relation === 'equipment'
            ? 'Matériel introuvable'
            : 'Agent introuvable';
      expect(content().textContent).toContain(expected);
      const selector =
        relation === 'incident'
          ? '.origin a'
          : relation === 'equipment'
            ? '.equipment-summary a'
            : '.metadata a';
      expect(content().querySelector(selector)).toBeNull();
    },
  );
  it('adapte les liens Agent et masque toute relation étrangère après changement d’id dans la même instance', async () => {
    const base = '/agent/interventions';
    const first = await harness.navigateByUrl(
      `${base}/INT-2026-032?q=OUT&status=planned&assignee=AG-DEMO-002`,
      InterventionDetail,
    );
    expect(content().querySelector('.back-link')?.getAttribute('href')).toBe(
      `${base}?q=OUT&status=planned`,
    );
    expect(content().querySelector('.origin-summary a')?.getAttribute('href')).toBe(
      '/agent/incidents/INC-2026-045',
    );
    expect(content().querySelector('.equipment-summary a')?.getAttribute('href')).toBe(
      '/agent/equipements/EQ-OUT-0003',
    );
    expect(await harness.navigateByUrl(`${base}/INT-2026-033`, InterventionDetail)).toBe(first);
    expect(content().querySelector('h1')?.textContent).toBe('Intervention non assignée');
    expect(content().textContent).not.toContain('Contrôle du système de freinage');
    expect(content().querySelector('.origin')).toBeNull();
    expect(content().querySelectorAll('a')).toHaveLength(1);
    expect(await harness.navigateByUrl(`${base}/absent`, InterventionDetail)).toBe(first);
    expect(content().querySelector('h1')?.textContent).toBe('Intervention introuvable');
    expect(await harness.navigateByUrl(`${base}/INT-2026-035`, InterventionDetail)).toBe(first);
    expect(content().querySelector('.instructions')?.textContent).toBe('Non renseignées');
    content().querySelector<HTMLAnchorElement>('.back-link')!.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe(base);
    expect(content().querySelectorAll('tbody tr')).toHaveLength(2);
  });
});
