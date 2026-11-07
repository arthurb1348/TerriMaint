import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { localToday } from '../interventions/planning-date';
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
  afterEach(() => {
    harness.fixture.destroy();
    vi.restoreAllMocks();
  });
  function content(): HTMLElement {
    return harness.routeNativeElement!;
  }

  it.each(['agent', 'responsable'])(
    'consulte tous les statuts liés dans %s avec le filtre d’affectation attendu',
    async (space) => {
      const data = TestBed.inject(DemoData);
      const sample = data.getIntervention('INT-2026-035')!;
      vi.spyOn(data, 'interventions').mockReturnValue([
        ...(['planned', 'in-progress', 'completed'] as const).map((status) => ({
          ...sample,
          id: status,
          title: `Intervention ${status}`,
          status,
        })),
        { ...sample, id: 'other-agent', title: 'Autre agent', agentId: 'AG-DEMO-002' },
        { ...sample, id: 'other-incident', incidentId: 'INC-2026-045' },
      ]);
      await harness.navigateByUrl(`/${space}/incidents/INC-2026-048?q=tondeuse`, IncidentDetail);
      const section = content().querySelector('.related-interventions')!;
      expect(section.querySelector('h2')?.textContent).toBe('Interventions liées');
      expect(section.querySelectorAll('a')).toHaveLength(space === 'agent' ? 3 : 4);
      expect(Array.from(section.querySelectorAll('.badge'), (badge) => badge.textContent)).toEqual(
        space === 'agent'
          ? ['Planifiée', 'En cours', 'Terminée']
          : ['Planifiée', 'En cours', 'Terminée', 'En cours'],
      );
      for (const link of section.querySelectorAll('a')) {
        expect(link.getAttribute('href')).toMatch(new RegExp(`^/${space}/interventions/`));
        expect(link.getAttribute('href')).not.toContain('?');
      }
      if (space === 'responsable') {
        for (const action of ['.planning-link', '#incident-close-action'])
          expect(
            section.compareDocumentPosition(content().querySelector(action)!) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          ).toBeTruthy();
      }
    },
  );

  it.each(['agent', 'responsable'])(
    'explique l’état vide de %s sans retirer les autres actions de la fiche',
    async (space) => {
      vi.spyOn(TestBed.inject(DemoData), 'interventions').mockReturnValue([]);
      await harness.navigateByUrl(`/${space}/incidents/INC-2026-048`, IncidentDetail);
      const section = content().querySelector('.related-interventions')!;
      expect(section.querySelector('a')).toBeNull();
      expect(section.textContent).toContain(
        space === 'agent'
          ? 'Aucune intervention ne vous est assignée pour ce signalement.'
          : 'Aucune intervention liée à ce signalement.',
      );
      expect(content().querySelector('.equipment-summary a')).not.toBeNull();
      if (space === 'responsable') {
        expect(content().querySelector('.planning-link')).not.toBeNull();
        expect(content().querySelector('#incident-close-action')).not.toBeNull();
      }
    },
  );

  it.each(['agent', 'responsable'])(
    'actualise les liens lorsque le composant de %s est réutilisé pour un autre signalement',
    async (space) => {
      const first = await harness.navigateByUrl(`/${space}/incidents/INC-2026-045`, IncidentDetail);
      expect(content().querySelector('.intervention-link')?.getAttribute('href')).toBe(
        `/${space}/interventions/INT-2026-032`,
      );
      expect(await harness.navigateByUrl(`/${space}/incidents/INC-2026-046`, IncidentDetail)).toBe(
        first,
      );
      const section = content().querySelector('.related-interventions')!;
      expect(section.textContent).not.toContain('Diagnostic et remise en état');
      if (space === 'responsable')
        expect(section.querySelector('a')?.getAttribute('href')).toBe(
          '/responsable/interventions/INT-2026-033',
        );
      else {
        expect(section.querySelector('a')).toBeNull();
        expect(section.textContent).toContain('Aucune intervention ne vous est assignée');
      }
    },
  );

  it.each(['agent', 'responsable'])(
    'suit les nouvelles programmations et statuts dans %s, même après clôture du signalement',
    async (space) => {
      const data = TestBed.inject(DemoData);
      await harness.navigateByUrl(`/${space}/incidents/INC-2026-048?q=tondeuse`, IncidentDetail);
      for (const agentId of ['AG-DEMO-001', 'AG-DEMO-002']) {
        expect(
          data.createIntervention({
            incidentId: 'INC-2026-048',
            title: `Nouvelle intervention ${agentId}`,
            instructions: '',
            agentId,
            plannedOn: localToday(),
          }),
        ).toBeDefined();
      }
      expect(data.completeAssignedIntervention('INT-2026-035')).toBe(true);
      harness.detectChanges();
      const section = content().querySelector('.related-interventions')!;
      const count = space === 'agent' ? 2 : 3;
      expect(section.querySelectorAll('a')).toHaveLength(count);
      expect(section.querySelector('.badge')?.textContent).toBe('Terminée');
      expect(section.textContent).toContain('Nouvelle intervention AG-DEMO-001');
      expect(section.textContent?.includes('Nouvelle intervention AG-DEMO-002')).toBe(
        space === 'responsable',
      );
      expect(data.closeIncident('INC-2026-048')).toBe(true);
      harness.detectChanges();
      expect(content().querySelector('.related-interventions a')).not.toBeNull();
      expect(section.querySelectorAll('a')).toHaveLength(count);
      expect(content().querySelector('.metadata')?.textContent).toContain('Clôturé');
      expect(content().querySelector('.back-link')?.getAttribute('href')).toBe(
        `/${space}/incidents?q=tondeuse`,
      );
    },
  );

  async function clickClosure(label: string): Promise<void> {
    const button = Array.from(content().querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === label,
    )!;
    button.click();
    harness.detectChanges();
    await harness.fixture.whenStable();
  }

  it('conserve l’avertissement pour une intervention active liée confiée à un autre agent', async () => {
    await harness.navigateByUrl('/responsable/incidents/INC-2026-047', IncidentDetail);
    expect(content().querySelector('.related-interventions .badge')?.textContent).toBe('En cours');
    await clickClosure('Clôturer le signalement');
    expect(content().querySelector('.closure-confirmation')?.textContent).toContain(
      'Au moins une intervention liée est encore planifiée ou en cours',
    );
  });

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
      expect(content().querySelector('.related-interventions')).toBeNull();
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
