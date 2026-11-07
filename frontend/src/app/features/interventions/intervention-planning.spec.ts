import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoData } from '../../core/demo-data';
import { routes } from '../../app.routes';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { DEMO_INCIDENTS } from '../incidents/incidents-demo';
import { DEMO_AGENTS } from './agents-demo';
import { InterventionPlanning } from './intervention-planning';
import { DEMO_INTERVENTIONS } from './interventions-demo';

describe('Programmation locale d’une intervention', () => {
  const base = '/responsable/interventions/nouvelle';
  let harness: RouterTestingHarness;
  beforeEach(async () => {
    // Seule Date est figée : les rendus et la navigation Angular restent asynchrones normalement.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 30, 12));
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
    vi.useRealTimers();
  });
  function content(): HTMLElement {
    return harness.routeNativeElement!;
  }
  function heading(): string {
    return content().querySelector('h1')!.textContent!.replace(/\s+/g, ' ').trim();
  }
  function field(name: string): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
    return content().querySelector(`#planning-${name}`)!;
  }
  async function enter(name: string, value: string): Promise<void> {
    const control = field(name);
    control.value = value;
    control.dispatchEvent(new Event(name === 'agent' ? 'change' : 'input'));
    await harness.fixture.whenStable();
  }
  async function submit(): Promise<void> {
    content()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
  }
  async function click(text: string): Promise<void> {
    Array.from(content().querySelectorAll<HTMLAnchorElement | HTMLButtonElement>('a, button'))
      .find((control) => {
        const label = control.cloneNode(true) as HTMLElement;
        label.querySelectorAll('[aria-hidden="true"]').forEach((icon) => icon.remove());
        return label.textContent?.trim() === text;
      })!
      .click();
    await harness.fixture.whenStable();
  }
  async function fillValid(): Promise<void> {
    await enter('title', '  Diagnostic du moteur  ');
    await enter('instructions', '  Vérifier le filtre.\nTester à chaud.  ');
    await enter('agent', 'AG-DEMO-002');
    await enter('date', '2026-10-30');
  }

  it.each(['form', 'review'])(
    'bloque une programmation déjà ouverte à l’étape %s si le signalement est clôturé',
    async (step) => {
      await harness.navigateByUrl(`${base}/INC-2026-045`, InterventionPlanning);
      await fillValid();
      if (step === 'review') await submit();
      const form = content().querySelector('form');
      const confirm = content().querySelector<HTMLButtonElement>('button');
      const data = TestBed.inject(DemoData);
      const interventions = data.interventions();
      expect(data.closeIncident('INC-2026-045')).toBe(true);
      if (step === 'form')
        form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      else confirm!.click();
      harness.detectChanges();
      await harness.fixture.whenStable();
      expect(heading()).toBe('Signalement clôturé');
      expect(content().querySelector('form')).toBeNull();
      expect(content().querySelector('button')).toBeNull();
      expect(data.interventions()).toBe(interventions);
    },
  );

  it('ouvre directement le contexte non modifiable depuis les sources et préremplit seulement le titre', async () => {
    await harness.navigateByUrl(`${base}/INC-2026-045`, InterventionPlanning);
    expect(heading()).toBe('Programmer une intervention');
    const origin = content().querySelector('.origin-summary')!.textContent;
    for (const value of [
      'INC-2026-045',
      'Moteur qui cale à l’accélération',
      'Basse',
      'Débroussailleuse n°3',
      'EQ-OUT-0003',
      'Atelier municipal',
    ]) {
      expect(origin).toContain(value);
    }
    expect(field('title').value).toBe(DEMO_INCIDENTS[0].title);
    for (const name of ['instructions', 'agent', 'date']) expect(field(name).value).toBe('');
    expect((field('instructions') as HTMLTextAreaElement).required).toBe(false);
    expect(field('date').getAttribute('min')).toBe('2026-10-30');
    expect(content().querySelectorAll('select option')).toHaveLength(4);
    expect(new Set(DEMO_AGENTS.map((agent) => agent.id)).size).toBe(DEMO_AGENTS.length);
    expect(content().querySelectorAll('#planning-agent option')).toHaveLength(4);
    expect(content().textContent).not.toMatch(
      /Disponibilité|Prestataire|Immobilis|Type d’incident/,
    );
    expect(content().querySelector('.origin-summary input')).toBeNull();
  });

  it.each([
    ['absent', 'Signalement introuvable', '/responsable/incidents?q=OUT'],
    ['INC-2026-049', 'Signalement clôturé', '/responsable/incidents/INC-2026-049?q=OUT'],
  ])(
    'bloque %s sans formulaire ni ancien contexte et propose un retour explicite',
    async (id, title, href) => {
      await harness.navigateByUrl(`${base}/INC-2026-045`, InterventionPlanning);
      await fillValid();
      await submit();
      await harness.navigateByUrl(`${base}/${id}?q=OUT`, InterventionPlanning);
      expect(heading()).toBe(title);
      expect(content().querySelector('form')).toBeNull();
      expect(content().querySelector('.origin-summary')).toBeNull();
      expect(content().querySelector('a')?.getAttribute('href')).toBe(href);
      expect(content().textContent).not.toContain('Diagnostic du moteur');
    },
  );

  it('bloque aussi un matériel associé introuvable après un changement de signalement', async () => {
    await harness.navigateByUrl(`${base}/INC-2026-045`, InterventionPlanning);
    await fillValid();
    // Simuler la rupture de relation sans modifier les fixtures ni ajouter une abstraction métier.
    vi.spyOn(DEMO_EQUIPMENT, 'find').mockReturnValue(undefined);
    await harness.navigateByUrl(`${base}/INC-2026-046`, InterventionPlanning);
    expect(heading()).toBe('Matériel introuvable');
    expect(content().querySelector('form')).toBeNull();
    expect(content().textContent).not.toContain('Débroussailleuse');
    expect(content().querySelector('a')?.getAttribute('href')).toBe(
      '/responsable/incidents/INC-2026-046',
    );
  });

  it.each(['', '   '])(
    'refuse le titre %j, agent et date absents sans perdre la saisie',
    async (title) => {
      await harness.navigateByUrl(`${base}/INC-2026-045`, InterventionPlanning);
      await enter('title', title);
      await enter('instructions', 'Consignes conservées');
      await submit();
      expect(content().querySelectorAll('.error')).toHaveLength(3);
      expect(field('title').value).toBe(title);
      expect(field('instructions').value).toBe('Consignes conservées');
      expect(document.activeElement).toBe(field('title'));
      expect(field('title').getAttribute('aria-describedby')).toContain('planning-title-error');
      expect(field('agent').getAttribute('aria-describedby')).toContain('planning-agent-error');
      expect(field('date').getAttribute('aria-describedby')).toContain('planning-date-error');
    },
  );

  it('focalise le choix d’agent puis la date passée sans perdre les autres champs', async () => {
    await harness.navigateByUrl(`${base}/INC-2026-045`, InterventionPlanning);
    await enter('date', '2026-10-29');
    await submit();
    expect(document.activeElement).toBe(field('agent'));
    await enter('agent', 'AG-DEMO-001');
    await submit();
    expect(document.activeElement).toBe(field('date'));
    expect(field('date').value).toBe('2026-10-29');
    expect(content().querySelectorAll('.error')).toHaveLength(1);
    await enter('date', '2026-10-30');
    await submit();
    expect(heading()).toBe('Vérifier l’intervention');
    expect(content().querySelector('time')?.textContent).toBe('30/10/2026');
  });

  it('refuse un agent hors de la source même si le contrôle HTML est contourné', async () => {
    await harness.navigateByUrl(`${base}/INC-2026-045`, InterventionPlanning);
    await fillValid();
    const option = document.createElement('option');
    option.value = 'agent-inconnu';
    field('agent').appendChild(option);
    await enter('agent', option.value);
    await submit();
    expect(heading()).toBe('Programmer une intervention');
    expect(content().querySelectorAll('.error')).toHaveLength(1);
    expect(document.activeElement).toBe(field('agent'));
  });

  it.each([
    ['title', 120, true],
    ['title', 121, false],
    ['instructions', 2000, true],
    ['instructions', 2001, false],
  ] as const)('contrôle %s à %i unités UTF-16, acceptée : %s', async (name, length, valid) => {
    await harness.navigateByUrl(`${base}/INC-2026-045`, InterventionPlanning);
    await fillValid();
    await enter(name, 'x'.repeat(length - 2) + '🌿');
    await submit();
    expect(heading()).toBe(valid ? 'Vérifier l’intervention' : 'Programmer une intervention');
    if (!valid) {
      expect(field(name).value.length).toBe(length);
      expect(document.activeElement).toBe(field(name));
    }
  });

  it.each(['', '  \n ', ' '.repeat(2001)])(
    'accepte les consignes absentes %j et conserve leur valeur au retour',
    async (value) => {
      await harness.navigateByUrl(`${base}/INC-2026-045`, InterventionPlanning);
      await fillValid();
      await enter('instructions', value);
      await submit();
      expect(heading()).toBe('Vérifier l’intervention');
      expect(content().querySelectorAll('dd')[1].textContent).toBe('Non renseignées');
      await click('Modifier l’intervention');
      expect(field('instructions').value).toBe(value);
      expect(document.activeElement).toBe(field('title'));
    },
  );

  it('récapitule, modifie puis confirme sans mutation ni données de formulaire dans l’URL', async () => {
    const sources = JSON.stringify([
      DEMO_INCIDENTS,
      DEMO_EQUIPMENT,
      DEMO_AGENTS,
      DEMO_INTERVENTIONS,
    ]);
    const query = { q: '  mOTeur  ', priority: 'low', status: 'open' };
    const url = `${base}/INC-2026-045?${new URLSearchParams(query)}`;
    await harness.navigateByUrl(url, InterventionPlanning);
    await fillValid();
    await submit();
    expect(Array.from(content().querySelectorAll('dd'), (item) => item.textContent)).toEqual([
      '  Diagnostic du moteur  ',
      '  Vérifier le filtre.\nTester à chaud.  ',
      'Alex Martin',
      '30/10/2026',
    ]);
    expect(document.activeElement).toBe(content().querySelector('h1'));
    const final = content().querySelector('button')!;
    expect(final.textContent).toContain('Programmer l’intervention');
    expect(final.getAttribute('aria-describedby')).toBeNull();
    expect(content().querySelector('#planning-demo-notice')).toBeNull();
    await click('Modifier l’intervention');
    expect(field('title').value).toBe('  Diagnostic du moteur  ');
    expect(field('instructions').value).toBe('  Vérifier le filtre.\nTester à chaud.  ');
    expect(field('agent').value).toBe('AG-DEMO-002');
    expect(field('date').value).toBe('2026-10-30');
    await enter('title', 'Contrôle du moteur');
    await submit();
    expect(content().querySelector('dd')?.textContent).toBe('Contrôle du moteur');
    await click('Programmer l’intervention');
    expect(heading()).toBe('Programmation terminée');
    expect(content().querySelectorAll('a')).toHaveLength(2);
    const component = harness.routeDebugElement!.componentInstance as {
      complete(): void;
      edit(): void;
    };
    component.complete();
    component.edit();
    component.complete();
    expect(TestBed.inject(DemoData).interventions()).toHaveLength(DEMO_INTERVENTIONS.length + 1);
    const created = TestBed.inject(DemoData).interventions().at(-1)!;
    expect(created.title).toBe('Contrôle du moteur');
    expect(
      content().querySelector(`a[href="/responsable/interventions/${created.id}"]`),
    ).not.toBeNull();
    expect(content().textContent).not.toMatch(/notifié|synchronisé/i);
    expect(content().querySelector('form')).toBeNull();
    expect(content().textContent).not.toMatch(/INT-2026|Succès/);
    expect(JSON.stringify([DEMO_INCIDENTS, DEMO_EQUIPMENT, DEMO_AGENTS, DEMO_INTERVENTIONS])).toBe(
      sources,
    );
    const router = TestBed.inject(Router);
    expect(router.parseUrl(router.url).queryParams).toEqual(query);
    await click('Retour au signalement');
    expect(router.url.split('?')[0]).toBe('/responsable/incidents/INC-2026-045');
    await click('Retour aux signalements');
    expect(router.parseUrl(router.url).queryParams).toEqual(query);
    expect(content().querySelector<HTMLInputElement>('input')!.value).toBe(query.q);
    expect(content().querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it.each(['form', 'review', 'complete'])(
    'efface les saisies et l’étape %s en changeant d’identifiant dans la même instance',
    async (step) => {
      const first = await harness.navigateByUrl(`${base}/INC-2026-045`, InterventionPlanning);
      await fillValid();
      if (step !== 'form') await submit();
      if (step === 'complete') await click('Programmer l’intervention');
      expect(await harness.navigateByUrl(`${base}/INC-2026-047`, InterventionPlanning)).toBe(first);
      expect(heading()).toBe('Programmer une intervention');
      expect(field('title').value).toBe(DEMO_INCIDENTS[2].title);
      expect(content().textContent).toContain('École des Marronniers');
      expect(content().textContent).not.toContain('Débroussailleuse');
      for (const name of ['instructions', 'agent', 'date']) expect(field(name).value).toBe('');
      expect(content().querySelector('.error')).toBeNull();
    },
  );

  it.each(['form', 'review'])(
    'conserve les saisies et l’étape %s si seuls les critères de retour changent',
    async (step) => {
      const url = `${base}/INC-2026-045`;
      const first = await harness.navigateByUrl(url, InterventionPlanning);
      await fillValid();
      if (step === 'review') await submit();
      expect(
        await harness.navigateByUrl(
          `${url}?q=%20OUT%20&priority=inconnu&status=open`,
          InterventionPlanning,
        ),
      ).toBe(first);
      if (step === 'review') {
        expect(heading()).toBe('Vérifier l’intervention');
        await click('Modifier l’intervention');
      }
      expect(field('title').value).toBe('  Diagnostic du moteur  ');
      expect(field('instructions').value).toBe('  Vérifier le filtre.\nTester à chaud.  ');
      expect(field('agent').value).toBe('AG-DEMO-002');
      expect(field('date').value).toBe('2026-10-30');
      expect(content().querySelector('a')?.getAttribute('href')).toBe(
        '/responsable/incidents/INC-2026-045?q=%20OUT%20&status=open',
      );
    },
  );

  it.each(['form', 'review'])(
    'annule depuis %s et retrouve les filtres exacts, puis repart sans saisie',
    async (step) => {
      const query = { q: '  mOTeur  ', priority: 'low', status: 'open' };
      const url = `${base}/INC-2026-045?${new URLSearchParams(query)}`;
      await harness.navigateByUrl(url, InterventionPlanning);
      await fillValid();
      if (step === 'review') await submit();
      await click('Annuler');
      expect(TestBed.inject(DemoData).interventions()).toHaveLength(DEMO_INTERVENTIONS.length);
      await click('Retour aux signalements');
      expect(TestBed.inject(Router).parseUrl(TestBed.inject(Router).url).queryParams).toEqual(
        query,
      );
      expect(content().querySelectorAll('tbody tr')).toHaveLength(1);
      await harness.navigateByUrl(url, InterventionPlanning);
      expect(field('title').value).toBe(DEMO_INCIDENTS[0].title);
      for (const name of ['instructions', 'agent', 'date']) expect(field(name).value).toBe('');
    },
  );

  it('revérifie la date si le jour change pendant le récapitulatif et conserve les valeurs', async () => {
    await harness.navigateByUrl(`${base}/INC-2026-045`, InterventionPlanning);
    await fillValid();
    await submit();
    vi.setSystemTime(new Date(2026, 9, 31, 0, 1));
    await click('Programmer l’intervention');
    expect(heading()).toBe('Programmer une intervention');
    expect(field('date').value).toBe('2026-10-30');
    expect(field('title').value).toBe('  Diagnostic du moteur  ');
    expect(field('date').getAttribute('min')).toBe('2026-10-31');
    expect(document.activeElement).toBe(field('date'));
    expect(content().querySelectorAll('.error')).toHaveLength(1);
  });
});
