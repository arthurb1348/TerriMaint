import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DemoData } from '../../core/demo-data';
import { InterventionPlanning } from '../interventions/intervention-planning';
import { routes } from '../../app.routes';
import { IncidentDetail } from './incident-detail';
import { Incidents } from './incidents';

describe('Détail local du signalement', () => {
  let harness: RouterTestingHarness;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
    harness = await RouterTestingHarness.create();
  });
  afterEach(() => harness.fixture.destroy());
  function content(): HTMLElement {
    return harness.routeNativeElement!;
  }

  async function clickClosure(label: string): Promise<void> {
    const button = Array.from(content().querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === label,
    )!;
    button.click();
    harness.detectChanges();
    await harness.fixture.whenStable();
  }

  it.each(['INC-2026-045', 'INC-2026-048'])(
    'demande une confirmation pour %s et annule sans mutation',
    async (id) => {
      await harness.navigateByUrl(`/responsable/incidents/${id}`, IncidentDetail);
      const data = TestBed.inject(DemoData);
      const incidents = data.incidents();
      const interventions = data.interventions();
      await clickClosure('Clôturer le signalement');
      const confirmation = content().querySelector('[role="group"]')!;
      expect(confirmation.textContent).toContain(
        'Au moins une intervention liée est encore planifiée ou en cours',
      );
      expect(confirmation.querySelector('button[disabled]')).toBeNull();
      expect(document.activeElement).toBe(content().querySelector('#incident-close-cancel'));
      expect(
        content().querySelector('#incident-close-cancel')?.getAttribute('aria-describedby'),
      ).toBe('incident-close-description');
      await clickClosure('Annuler');
      expect(content().querySelector('[role="group"]')).toBeNull();
      expect(document.activeElement).toBe(content().querySelector('#incident-close-action'));
      expect(data.incidents()).toBe(incidents);
      expect(data.interventions()).toBe(interventions);
    },
  );

  it('clôture malgré l’avertissement si le Responsable confirme, sans changer les interventions', async () => {
    await harness.navigateByUrl('/responsable/incidents/INC-2026-048', IncidentDetail);
    const data = TestBed.inject(DemoData);
    const interventions = data.interventions();
    await clickClosure('Clôturer le signalement');
    await clickClosure('Clôturer le signalement');
    expect(data.getIncident('INC-2026-048')?.status).toBe('closed');
    expect(data.interventions()).toBe(interventions);
    expect(data.getIntervention('INT-2026-035')?.status).toBe('in-progress');
    expect(content().querySelector('.metadata')?.textContent).toContain('Clôturé');
    expect(content().querySelector('.planning-link')).toBeNull();
    expect(content().querySelector('.planning-note')?.textContent).toContain('clôturé');
    const feedback = content().querySelector('[role="status"]')!;
    expect(feedback.textContent?.trim()).toBe('Le signalement est maintenant clôturé.');
    expect(document.activeElement).toBe(feedback);
    expect(TestBed.inject(Router).url).toBe('/responsable/incidents/INC-2026-048');
    await harness.navigateByUrl('/responsable/incidents?status=closed', Incidents);
    expect(content().querySelectorAll('tbody tr')).toHaveLength(3);
    expect(content().querySelector('tbody')?.textContent).toContain('INC-2026-048');
    await harness.navigateByUrl('/agent/incidents/INC-2026-048', IncidentDetail);
    expect(content().querySelector('.metadata')?.textContent).toContain('Clôturé');
    expect(content().querySelector('.closure-actions')).toBeNull();
    await harness.navigateByUrl(
      '/responsable/interventions/nouvelle/INC-2026-048',
      InterventionPlanning,
    );
    expect(content().querySelector('h1')?.textContent).toBe('Signalement clôturé');
    expect(content().querySelector('form')).toBeNull();
  });

  it('actualise l’avertissement quand la dernière intervention active est terminée', async () => {
    await harness.navigateByUrl('/responsable/incidents/INC-2026-048', IncidentDetail);
    await clickClosure('Clôturer le signalement');
    expect(content().querySelector('.closure-confirmation .risk-note')).not.toBeNull();
    expect(TestBed.inject(DemoData).completeAssignedIntervention('INT-2026-035')).toBe(true);
    harness.detectChanges();
    expect(content().querySelector('.closure-confirmation .risk-note')).toBeNull();
    await clickClosure('Clôturer le signalement');
    expect(TestBed.inject(DemoData).getIntervention('INT-2026-035')?.status).toBe('completed');
  });

  it('revalide le statut au dernier clic si une autre action a déjà clôturé le signalement', async () => {
    await harness.navigateByUrl('/responsable/incidents/INC-2026-048', IncidentDetail);
    await clickClosure('Clôturer le signalement');
    const confirm = content().querySelector<HTMLButtonElement>(
      '.confirmation-buttons button:last-child',
    )!;
    const data = TestBed.inject(DemoData);
    expect(data.closeIncident('INC-2026-048')).toBe(true);
    const after = data.incidents();
    confirm.click();
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(data.incidents()).toBe(after);
    expect(content().querySelector('[role="status"]')?.textContent).toContain(
      'La clôture n’a pas été effectuée',
    );
    expect(content().querySelector('[role="group"]')).toBeNull();
  });

  it('ne reporte ni confirmation ni message de clôture sur un autre identifiant', async () => {
    const first = await harness.navigateByUrl(
      '/responsable/incidents/INC-2026-045',
      IncidentDetail,
    );
    await clickClosure('Clôturer le signalement');
    expect(await harness.navigateByUrl('/responsable/incidents/INC-2026-048', IncidentDetail)).toBe(
      first,
    );
    expect(content().querySelector('[role="group"]')).toBeNull();
    await harness.navigateByUrl('/responsable/incidents/INC-2026-045', IncidentDetail);
    expect(content().querySelector('[role="group"]')).toBeNull();
    await clickClosure('Clôturer le signalement');
    await clickClosure('Clôturer le signalement');
    await harness.navigateByUrl('/responsable/incidents/INC-2026-048', IncidentDetail);
    expect(content().querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    expect(content().querySelector('.metadata')?.textContent).toContain('En cours');
  });

  it.each([
    '/agent/incidents/INC-2026-045',
    '/agent/incidents/INC-2026-048',
    '/agent/incidents/INC-2026-049',
    '/responsable/incidents/INC-2026-049',
    '/responsable/incidents/absent',
  ])('ne propose pas la clôture sur %s', async (url) => {
    await harness.navigateByUrl(url, IncidentDetail);
    expect(content().querySelector('#incident-close-action')).toBeNull();
    expect(content().querySelector('[role="group"]')).toBeNull();
  });

  for (const space of ['agent', 'responsable']) {
    const base = `/${space}/incidents`;
    it(`ouvre directement le bon détail dans ${space} et lie le matériel sans lui transmettre les filtres`, async () => {
      await harness.navigateByUrl(
        `${base}/INC-2026-045?q=moteur&priority=low&status=open`,
        IncidentDetail,
      );
      expect(content().querySelector('h1')?.textContent).toBe('Moteur qui cale à l’accélération');
      expect(content().textContent).not.toContain('Données de démonstration');
      expect(content().textContent).toContain('INC-2026-045');
      expect(content().querySelector('.description')?.textContent).toBe(
        'Le moteur cale lors de l’accélération et devient difficile à redémarrer.',
      );
      expect(content().querySelector('time')?.textContent).toBe('28/10/2026');
      expect(content().querySelector('.metadata')?.textContent).toContain('Basse');
      expect(content().querySelector('.metadata')?.textContent).toContain('Ouvert');
      expect(content().querySelector('.equipment-summary')?.textContent).toContain(
        'Débroussailleuse n°3',
      );
      expect(content().querySelector('.equipment-summary')?.textContent).toContain(
        'Atelier municipal',
      );
      expect(content().querySelector('.equipment-summary a')?.getAttribute('href')).toBe(
        `/${space}/equipements/EQ-OUT-0003`,
      );
      expect(content().querySelector('.risk-note')).toBeNull();
      expect(content().textContent).not.toMatch(
        /Disponible|Synchronisé|Récurrence|Créer une intervention/,
      );
    });

    it(`conserve q/priorité/statut au retour à la liste de ${space} après un accès direct`, async () => {
      const query = '  tONDEUSE  ';
      const params = { q: query, priority: 'high', status: 'in-progress' };
      await harness.navigateByUrl(
        `${base}/INC-2026-048?${new URLSearchParams(params)}`,
        IncidentDetail,
      );
      expect(content().querySelector('.description')?.textContent).toBe('Non renseignée');
      content().querySelector<HTMLAnchorElement>('.back-link')!.click();
      await harness.fixture.whenStable();
      expect(TestBed.inject(Router).parseUrl(TestBed.inject(Router).url).queryParams).toEqual(
        params,
      );
      expect(content().querySelector<HTMLInputElement>('input')!.value).toBe(query);
      expect(content().querySelector<HTMLSelectElement>('#incident-priority-filter')!.value).toBe(
        'high',
      );
      expect(content().querySelector<HTMLSelectElement>('#incident-status-filter')!.value).toBe(
        'in-progress',
      );
      expect(content().querySelectorAll('tbody tr')).toHaveLength(1);
      expect(content().querySelector('tbody')?.textContent).toContain('INC-2026-048');
    });

    it(`actualise id dans une même instance de ${space}, y compris description absente et identifiant inconnu`, async () => {
      const first = await harness.navigateByUrl(`${base}/INC-2026-045`, IncidentDetail);
      expect(await harness.navigateByUrl(`${base}/INC-2026-046`, IncidentDetail)).toBe(first);
      expect(content().querySelector('h1')?.textContent).toBe(
        'Bruit au freinage du fourgon de voirie',
      );
      expect(content().textContent).not.toContain('Débroussailleuse');
      expect(content().querySelector('.risk-note')?.textContent).toContain(
        'ne change pas le statut du matériel',
      );
      expect(
        await harness.navigateByUrl(
          `${base}/absent?q=OUT&priority=urgent&status=closed`,
          IncidentDetail,
        ),
      ).toBe(first);
      expect(content().querySelector('h1')?.textContent).toBe('Signalement introuvable');
      expect(content().querySelector('dl')).toBeNull();
      expect(content().querySelector('.equipment-summary')).toBeNull();
      expect(content().querySelector('.back-link')?.getAttribute('href')).toBe(
        `${base}?q=OUT&priority=urgent&status=closed`,
      );
      expect(await harness.navigateByUrl(`${base}/INC-2026-048`, IncidentDetail)).toBe(first);
      expect(content().querySelector('.description')?.textContent).toBe('Non renseignée');
      expect(content().querySelector('.risk-note')).toBeNull();
      expect(content().textContent).not.toContain('Bruit au freinage');
    });
  }

  it('actualise les paramètres de retour sur le même détail et retire les filtres inconnus', async () => {
    const first = await harness.navigateByUrl('/agent/incidents/INC-2026-045', IncidentDetail);
    expect(
      await harness.navigateByUrl(
        '/agent/incidents/INC-2026-045?q=OUT&priority=incorrect&status=incorrect',
        IncidentDetail,
      ),
    ).toBe(first);
    expect(content().querySelector('.back-link')?.getAttribute('href')).toBe(
      '/agent/incidents?q=OUT',
    );
  });

  it('relit la même source au retour par lien depuis une liste filtrée', async () => {
    await harness.navigateByUrl('/responsable/incidents?priority=urgent&status=open', Incidents);
    content().querySelector<HTMLAnchorElement>('tbody a')!.click();
    await harness.fixture.whenStable();
    expect(content().querySelector('h1')?.textContent).toBe(
      'Bruit au freinage du fourgon de voirie',
    );
    content().querySelector<HTMLAnchorElement>('.back-link')!.click();
    await harness.fixture.whenStable();
    expect(content().querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it.each(['INC-2026-045', 'INC-2026-047'])(
    'propose la programmation au Responsable pour %s et conserve les filtres',
    async (id) => {
      await harness.navigateByUrl(
        `/responsable/incidents/${id}?q=%20OUT%20&priority=high&status=in-progress`,
        IncidentDetail,
      );
      expect(content().querySelector('.planning-link')?.getAttribute('href')).toBe(
        `/responsable/interventions/nouvelle/${id}?q=%20OUT%20&priority=high&status=in-progress`,
      );
      expect(content().querySelector('.planning-note')).toBeNull();
    },
  );

  it('explique le blocage d’un signalement clôturé au Responsable sans action factice', async () => {
    await harness.navigateByUrl('/responsable/incidents/INC-2026-049', IncidentDetail);
    expect(content().querySelector('.planning-link')).toBeNull();
    expect(content().querySelector('.planning-note')?.textContent).toContain('clôturé');
    expect(content().querySelector('button[disabled]')).toBeNull();
  });

  it.each(['INC-2026-045', 'INC-2026-047', 'INC-2026-049'])(
    'préserve la consultation Agent sans programmation pour %s',
    async (id) => {
      await harness.navigateByUrl(`/agent/incidents/${id}`, IncidentDetail);
      expect(content().querySelector('.planning-link')).toBeNull();
      expect(content().querySelector('.planning-note')).toBeNull();
    },
  );
});
