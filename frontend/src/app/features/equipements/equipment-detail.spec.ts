import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoData } from '../../core/demo-data';
import { localToday } from '../interventions/planning-date';
import { routes } from '../../app.routes';
import { EquipmentDetail } from './equipment-detail';

describe('Fiche de matériel de démonstration', () => {
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

  function returnUrl(): string {
    return content().querySelector('a')!.getAttribute('href')!;
  }

  it.each(['agent', 'responsable'])(
    'ouvre directement une fiche dans %s avec le même composant et les données existantes',
    async (space) => {
      await harness.navigateByUrl(`/${space}/equipements/EQ-OUT-0003`, EquipmentDetail);
      expect(content().querySelector('h1')?.textContent).toBe('Débroussailleuse n°3');
      expect(Array.from(content().querySelectorAll('dd'), (field) => field.textContent)).toEqual([
        'EQ-OUT-0003',
        'Atelier municipal',
      ]);
      expect(content().textContent).not.toContain('Données de démonstration');
      expect(returnUrl()).toBe(`/${space}/equipements`);
      expect(content().querySelector('a span[aria-hidden="true"]')?.textContent).toBe('←');
      expect(content().querySelector('a span:last-child')?.textContent).toBe('Retour au matériel');
      const declaration = content().querySelector<HTMLAnchorElement>('.declaration-link')!;
      expect(declaration.textContent?.trim()).toBe('Faire un signalement');
      expect(declaration.getAttribute('href')).toBe(`/${space}/incidents/nouveau/EQ-OUT-0003`);
      expect(content().textContent).not.toMatch(/Synchronisé|Disponible/);
    },
  );

  it.each(['agent', 'responsable'])(
    'explique un identifiant inconnu dans %s et permet le retour avec q',
    async (space) => {
      await harness.navigateByUrl(`/${space}/equipements/inconnu?q=Souffleur`, EquipmentDetail);
      expect(content().querySelector('h1')?.textContent).toBe('Équipement introuvable');
      expect(content().querySelector('dl')).toBeNull();
      expect(content().querySelector('.equipment-interventions')).toBeNull();
      expect(content().querySelector('.declaration-link')).toBeNull();
      expect(content().textContent).not.toContain('Données de démonstration');
      expect(returnUrl()).toBe(`/${space}/equipements?q=Souffleur`);
    },
  );

  it.each(['agent', 'responsable'])(
    'actualise la fiche réutilisée quand id change dans %s, y compris après un inconnu',
    async (space) => {
      const first = await harness.navigateByUrl(
        `/${space}/equipements/EQ-OUT-0003`,
        EquipmentDetail,
      );
      const second = await harness.navigateByUrl(
        `/${space}/equipements/EQ-VEH-0042`,
        EquipmentDetail,
      );
      expect(second).toBe(first);
      expect(content().querySelector('h1')?.textContent).toBe('Fourgon de voirie');
      expect(content().textContent).toContain('Garage municipal');
      expect(content().textContent).not.toContain('Débroussailleuse');
      expect(content().textContent).not.toContain('Atelier municipal');

      const unknown = await harness.navigateByUrl(`/${space}/equipements/inconnu`, EquipmentDetail);
      expect(unknown).toBe(first);
      expect(content().querySelector('h1')?.textContent).toBe('Équipement introuvable');
      expect(content().textContent).not.toContain('Fourgon');

      const last = await harness.navigateByUrl(
        `/${space}/equipements/EQ-OUT-0001`,
        EquipmentDetail,
      );
      expect(last).toBe(first);
      expect(content().querySelector('h1')?.textContent).toBe('Tondeuse autoportée');
      expect(content().textContent).not.toContain('Équipement introuvable');
    },
  );

  it.each(['agent', 'responsable'])(
    'conserve q pour le retour et suit ses modifications sur la même fiche dans %s',
    async (space) => {
      const component = await harness.navigateByUrl(
        `/${space}/equipements/EQ-OUT-0001?q=%20%20tONDeUSE%20%20`,
        EquipmentDetail,
      );
      const router = TestBed.inject(Router);
      expect(router.parseUrl(returnUrl()).queryParams['q']).toBe('  tONDeUSE  ');
      expect(
        router.parseUrl(content().querySelector('.declaration-link')!.getAttribute('href')!)
          .queryParams['q'],
      ).toBe('  tONDeUSE  ');
      expect(
        await harness.navigateByUrl(`/${space}/equipements/EQ-OUT-0001?q=EQ-OUT`, EquipmentDetail),
      ).toBe(component);
      expect(router.parseUrl(returnUrl()).queryParams['q']).toBe('EQ-OUT');
    },
  );

  it.each(['agent', 'responsable'])(
    'filtre par matériel et espace %s sans exclure les interventions terminées',
    async (space) => {
      const data = TestBed.inject(DemoData);
      const sample = data.interventions()[3];
      vi.spyOn(data, 'interventions').mockReturnValue([
        ...(['planned', 'in-progress', 'completed'] as const).map((status) => ({
          ...sample,
          id: status,
          title: `Intervention ${status}`,
          status,
        })),
        { ...sample, id: 'other-agent', title: 'Autre agent', agentId: 'AG-DEMO-002' },
        { ...sample, id: 'other-equipment', incidentId: 'INC-2026-046', equipmentId: 'EQ-VEH-0042' },
        { ...sample, id: 'missing-equipment', equipmentId: 'absent' },
      ]);
      await harness.navigateByUrl(`/${space}/equipements/EQ-OUT-0001?q=tondeuse`, EquipmentDetail);
      const section = content().querySelector('.equipment-interventions')!;
      const links = section.querySelectorAll('a');
      expect(links).toHaveLength(space === 'agent' ? 3 : 4);
      expect(Array.from(section.querySelectorAll('.badge'), (badge) => badge.textContent)).toEqual(
        space === 'agent'
          ? ['Planifiée', 'En cours', 'Terminée']
          : ['Planifiée', 'En cours', 'Terminée', 'En cours'],
      );
      expect(section.textContent).not.toContain('Date de fin');
      expect(section.querySelectorAll('time')).toHaveLength(links.length);
      for (const link of links) {
        expect(link.textContent).toContain('Date prévue');
        expect(link.getAttribute('href')).toMatch(new RegExp(`^/${space}/interventions/`));
        expect(link.getAttribute('href')).not.toContain('?');
      }
    },
  );

  it.each(['agent', 'responsable'])(
    'affiche un message vide adapté à %s et conserve la déclaration',
    async (space) => {
      vi.spyOn(TestBed.inject(DemoData), 'interventions').mockReturnValue([]);
      await harness.navigateByUrl(`/${space}/equipements/EQ-OUT-0001`, EquipmentDetail);
      const section = content().querySelector('.equipment-interventions')!;
      expect(section.querySelector('h2')?.textContent).toBe('Interventions');
      expect(section.textContent).toContain(
        space === 'agent'
          ? 'Aucune intervention ne vous est assignée pour ce matériel.'
          : 'Aucune intervention liée à ce matériel.',
      );
      expect(section.querySelector('a')).toBeNull();
      expect(content().querySelector('.declaration-link')).not.toBeNull();
    },
  );

  it.each(['agent', 'responsable'])(
    'actualise les interventions lors du passage direct à un autre matériel dans %s',
    async (space) => {
      const first = await harness.navigateByUrl(
        `/${space}/equipements/EQ-OUT-0003`,
        EquipmentDetail,
      );
      expect(content().querySelector('.intervention-link')?.getAttribute('href')).toBe(
        `/${space}/interventions/INT-2026-032`,
      );
      const second = await harness.navigateByUrl(
        `/${space}/equipements/EQ-VEH-0042`,
        EquipmentDetail,
      );
      expect(second).toBe(first);
      expect(content().textContent).not.toContain('Diagnostic et remise en état');
      if (space === 'responsable')
        expect(content().querySelector('.intervention-link')?.getAttribute('href')).toBe(
          '/responsable/interventions/INT-2026-033',
        );
      else {
        expect(content().querySelector('.intervention-link')).toBeNull();
        expect(content().textContent).toContain('Aucune intervention ne vous est assignée');
      }
    },
  );

  it.each(['agent', 'responsable'])(
    'réagit aux créations en mémoire sans recharger la fiche dans %s',
    async (space) => {
      const data = TestBed.inject(DemoData);
      await harness.navigateByUrl(`/${space}/equipements/EQ-OUT-0001`, EquipmentDetail);
      const incident = data.createIncident({
        equipmentId: 'EQ-OUT-0001',
        title: 'Nouveau signalement',
        description: '',
        priority: 'low',
        risk: false,
        photos: [],
      })!;
      for (const agentId of ['AG-DEMO-001', 'AG-DEMO-002']) {
        const intervention = data.createIntervention({
          incidentId: incident.id,
          title: `Nouvelle intervention ${agentId}`,
          instructions: '',
          agentId,
          plannedOn: localToday(),
        });
        expect(intervention).toBeDefined();
      }
      harness.detectChanges();
      await harness.fixture.whenStable();
      const section = content().querySelector('.equipment-interventions')!;
      expect(section.querySelectorAll('a')).toHaveLength(space === 'agent' ? 2 : 3);
      expect(section.textContent).toContain('Nouvelle intervention AG-DEMO-001');
      expect(section.textContent?.includes('Nouvelle intervention AG-DEMO-002')).toBe(
        space === 'responsable',
      );
      expect(section.textContent).toContain('Vérification du plateau de coupe');
    },
  );
});
