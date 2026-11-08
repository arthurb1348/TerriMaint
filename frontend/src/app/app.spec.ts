/** Vérifie les pages rendues, la navigation et le contrat HTTP conservé. */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';
import { DEMO_INCIDENTS } from './features/incidents/incidents-demo';
import { DEMO_INTERVENTIONS } from './features/interventions/interventions-demo';

describe('Shell et routage', () => {
  let fixture: ComponentFixture<App>;
  let http: HttpTestingController;
  let router: Router;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    element = fixture.nativeElement as HTMLElement;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    fixture.destroy();
    element.remove();
  });

  async function navigate(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it.each(['/', '/inconnue', '/agent/inconnue', '/agent/interventions/nouvelle/INC-2026-045'])(
    'affiche l’accueil depuis %s',
    async (url) => {
      await navigate(url);
      http.expectOne('/api/v1/health').flush({ status: 'ok' });
      await fixture.whenStable();
      expect(element.querySelector('h1')?.textContent).toContain('Du terrain');
      expect(element.textContent).toContain('API disponible');
      expect(element.textContent).not.toContain('Synchronisé');
      expect(router.url).toBe('/');
      expect(element.querySelectorAll('main')).toHaveLength(1);
      expect(element.querySelector('a[href="#main-content"]')).not.toBeNull();
      expect(element.querySelector('main')?.id).toBe('main-content');
      expect(element.querySelector('nav a[aria-current="page"]')?.textContent).toContain('Accueil');
    },
  );

  it.each([
    ['/agent', 'Accueil', 'Accueil Agent'],
    ['/responsable', 'Tableau de bord', 'Tableau de bord'],
    ['/agent/equipements', 'Matériel', 'Matériel'],
    ['/responsable/equipements', 'Matériel', 'Matériel'],
    ['/agent/incidents', 'Signalements', 'Signalements'],
    ['/responsable/incidents', 'Signalements', 'Signalements'],
    ['/responsable/interventions', 'Interventions', 'Interventions'],
    ['/agent/scanner', 'Scanner', 'Scanner'],
    ['/responsable/scanner', 'Scanner', 'Scanner'],
    ['/agent/profil', 'Profil', 'Profil'],
    ['/responsable/agents', 'Agents', 'Agents'],
  ])(
    'ouvre directement %s avec son titre et son contexte de navigation',
    async (url, heading, title) => {
      await navigate(url);
      expect(element.querySelectorAll('h1')).toHaveLength(1);
      expect(element.querySelector('.app-bar h1, .screen-title')).toBeNull();
      expect(element.querySelector('main h1')?.textContent).toBe(heading);
      expect(TestBed.inject(Title).getTitle()).toBe(`${title} — TerriMaint`);
      const current = element.querySelectorAll('nav a[aria-current="page"]');
      expect(current).toHaveLength(1);
      expect(current[0]?.getAttribute('href')).toBe(url);
      if (url.endsWith('/scanner')) {
        expect(element.querySelector('main .back-link')?.getAttribute('href')).toBe(
          url.startsWith('/agent') ? '/agent' : '/responsable',
        );
      }
      http.expectNone('/api/v1/health');
    },
  );

  it.each(['/agent', '/responsable'])(
    'conserve le lien de marque natif et un nom accessible unique depuis %s',
    async (url) => {
      await navigate(url);
      const brand = element.querySelector<HTMLAnchorElement>('.brand-link')!;
      expect(brand.getAttribute('aria-label')).toBe('TerriMaint — Accueil général');
      expect(brand.getAttribute('href')).toBe('/');
      expect(brand.textContent?.trim()).toBe('');
      expect(Array.from(brand.querySelectorAll('img'), (image) => image.alt)).toEqual(['', '']);
      brand.click();
      await fixture.whenStable();
      expect(router.url).toBe('/');
      http.expectOne('/api/v1/health').flush({ status: 'ok' });
      await fixture.whenStable();
      expect(element.querySelector('.app-bar h1, .screen-title')).toBeNull();
    },
  );

  it('conserve les accès métier Responsable et change d’espace par le shell', async () => {
    await navigate('/responsable');
    const links = element.querySelectorAll<HTMLAnchorElement>('main .indicators a');
    expect(Array.from(links, (link) => link.getAttribute('href'))).toEqual([
      '/responsable/incidents?status=open',
      '/responsable/incidents?priority=urgent&status=not-closed',
      '/responsable/interventions?status=planned',
    ]);
    expect(element.querySelector('main a[href="/agent"]')).toBeNull();
    element.querySelector<HTMLAnchorElement>('.space-links a[href="/agent"]')?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/agent');
    expect(element.querySelector('h1')?.textContent).toBe('Accueil');
    element.querySelector<HTMLAnchorElement>('nav a[href="/agent/incidents"]')?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/agent/incidents');
    expect(element.querySelector('h1')?.textContent).toBe('Signalements');
    element.querySelector<HTMLAnchorElement>('.space-links a[href="/"]')?.click();
    await fixture.whenStable();
    http.expectOne('/api/v1/health').flush({ status: 'ok' });
    await fixture.whenStable();
    expect(element.textContent).toContain('API disponible');
    expect(element.textContent).not.toContain('Synchronisé');
  });

  it('annule le GET en quittant l’accueil et le relance au retour', async () => {
    await navigate('/');
    const request = http.expectOne('/api/v1/health');
    await navigate('/agent');
    expect(request.cancelled).toBe(true);
    await navigate('/');
    http.expectOne('/api/v1/health').flush({ status: 'ok' });
    await fixture.whenStable();
    expect(element.textContent).toContain('API disponible');
    expect(element.textContent).not.toContain('Synchronisé');
  });
  it.each([
    ['/equipements', '/agent/equipements'],
    ['/incidents', '/agent/incidents'],
    ['/interventions', '/responsable/interventions'],
  ])('conserve les anciennes URL : %s', async (oldUrl, target) => {
    await navigate(oldUrl);
    expect(router.url).toBe(target);
    expect(element.querySelector('nav a[aria-current="page"]')?.getAttribute('href')).toBe(target);
  });

  it('conserve la navigation Responsable sur les domaines partagés', async () => {
    await navigate('/responsable/incidents');
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Navigation Responsable');
    element.querySelector<HTMLAnchorElement>('nav a[href="/responsable/equipements"]')?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/responsable/equipements');
    expect(element.querySelector('.app-bar h1, .screen-title')).toBeNull();
    expect(element.querySelectorAll('nav a[aria-current="page"]')).toHaveLength(1);
  });

  it.each([
    ['agent', 'EQ-OUT-0001'],
    ['agent', 'inconnu'],
    ['responsable', 'EQ-OUT-0001'],
    ['responsable', 'inconnu'],
  ])('garde Matériel actif sur une fiche de %s, id %s et recherche q', async (space, id) => {
    await navigate(`/${space}/equipements/${id}?q=tondeuse`);
    expect(element.querySelector('app-equipment-detail')).not.toBeNull();
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe(
      space === 'agent' ? 'Navigation Agent' : 'Navigation Responsable',
    );
    expect(element.querySelector('.app-bar h1, .screen-title')).toBeNull();
    const active = element.querySelectorAll('nav a[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0].getAttribute('href')).toBe(`/${space}/equipements`);
    expect(active[0].textContent).toContain('Matériel');
    http.expectNone('/api/v1/health');
  });

  it.each(['agent', 'responsable'])(
    'garde Incidents actif pendant formulaire, récapitulatif et fin dans %s, y compris Plus',
    async (space) => {
      const source = JSON.stringify([DEMO_INCIDENTS, DEMO_INTERVENTIONS]);
      await navigate(`/${space}/incidents/nouveau/EQ-OUT-0003?q=OUT`);
      const assertNavigation = () => {
        expect(element.querySelector('.app-bar h1, .screen-title')).toBeNull();
        const active = element.querySelectorAll('nav a[aria-current="page"]');
        expect(active).toHaveLength(1);
        expect(active[0].getAttribute('href')).toBe(`/${space}/incidents`);
        if (space === 'agent') {
          expect(element.querySelector('.more-toggle')?.classList.contains('active')).toBe(true);
          expect(element.querySelector('.more-toggle')?.getAttribute('aria-label')).toBe(
            'Plus — Signalements actif',
          );
        }
      };
      assertNavigation();
      for (const name of ['title', 'description']) {
        const input = element.querySelector<HTMLInputElement>(`#incident-${name}`)!;
        input.value = 'Une observation';
        input.dispatchEvent(new Event('input'));
      }
      element.querySelector<HTMLInputElement>('#priority-low')!.click();
      element
        .querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await fixture.whenStable();
      expect(element.querySelector('main h1')?.textContent).toContain('Vérifier le signalement');
      assertNavigation();
      element.querySelector<HTMLButtonElement>('main button')!.click();
      await fixture.whenStable();
      expect(element.querySelector('main h1')?.textContent).toContain('Signalement terminé');
      assertNavigation();
      await navigate(`/${space}/incidents`);
      expect(element.querySelectorAll('main tbody tr')).toHaveLength(7);
      expect(JSON.stringify([DEMO_INCIDENTS, DEMO_INTERVENTIONS])).toBe(source);
      http.expectNone(() => true);
    },
  );

  it.each([
    ['agent', 'INC-2026-045'],
    ['agent', 'absent'],
    ['responsable', 'INC-2026-045'],
    ['responsable', 'absent'],
  ])('garde le contexte et Incidents actif sur le détail de %s, id %s', async (space, id) => {
    await navigate(`/${space}/incidents/${id}?q=OUT&priority=low&status=open`);
    expect(element.querySelector('app-incident-detail')).not.toBeNull();
    expect(element.querySelector('.app-bar h1, .screen-title')).toBeNull();
    const active = element.querySelectorAll('nav a[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0].getAttribute('href')).toBe(`/${space}/incidents`);
    if (space === 'agent')
      expect(element.querySelector('.more-toggle')?.getAttribute('aria-label')).toBe(
        'Plus — Signalements actif',
      );
    http.expectNone(() => true);
  });

  it.each(['agent', 'responsable'])(
    'ouvre une fiche depuis la recherche de %s puis retrouve la saisie et les résultats',
    async (space) => {
      document.body.appendChild(element);
      await navigate(`/${space}/equipements?q=%20%20tONDeUSE%20%20`);
      const input = element.querySelector<HTMLInputElement>('main input')!;
      expect(input.value).toBe('  tONDeUSE  ');
      expect(element.querySelectorAll('main li')).toHaveLength(1);
      element.querySelector<HTMLAnchorElement>('main li a')!.click();
      await fixture.whenStable();
      expect(router.url).toMatch(new RegExp(`^/${space}/equipements/EQ-OUT-0001\\?q=`));
      expect(element.querySelector('main h1')?.textContent).toBe('Tondeuse autoportée');
      element.querySelector<HTMLAnchorElement>('main .back-link')!.click();
      await fixture.whenStable();
      expect(router.parseUrl(router.url).queryParams['q']).toBe('  tONDeUSE  ');
      expect(element.querySelector<HTMLInputElement>('main input')?.value).toBe('  tONDeUSE  ');
      expect(element.querySelectorAll('main li')).toHaveLength(1);
      expect(element.querySelector('main li')?.textContent).toContain('Tondeuse autoportée');
      expect(document.activeElement).toBe(element.querySelector('main'));
      expect(element.querySelector('nav a[aria-current="page"]')?.getAttribute('href')).toBe(
        `/${space}/equipements`,
      );
    },
  );

  it('garde Interventions actif pendant les trois étapes de programmation sans requête métier', async () => {
    const source = JSON.stringify(DEMO_INTERVENTIONS);
    await navigate('/responsable/interventions/nouvelle/INC-2026-045?q=OUT');
    const assertNavigation = () => {
      expect(element.querySelector('.app-bar h1, .screen-title')).toBeNull();
      const active = element.querySelectorAll('nav a[aria-current="page"]');
      expect(active).toHaveLength(1);
      expect(active[0].getAttribute('href')).toBe('/responsable/interventions');
    };
    assertNavigation();
    const date = element.querySelector<HTMLInputElement>('#planning-date')!;
    date.value = date.min;
    date.dispatchEvent(new Event('input'));
    const agent = element.querySelector<HTMLSelectElement>('#planning-agent')!;
    agent.value = 'AG-DEMO-001';
    agent.dispatchEvent(new Event('change'));
    element
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(element.querySelector('main h1')?.textContent).toContain('Vérifier l’intervention');
    assertNavigation();
    element.querySelector<HTMLButtonElement>('main button')!.click();
    await fixture.whenStable();
    expect(element.querySelector('main h1')?.textContent).toContain('Programmation terminée');
    assertNavigation();
    await navigate('/responsable/interventions');
    expect(element.querySelectorAll('main tbody tr')).toHaveLength(7);
    expect(JSON.stringify(DEMO_INTERVENTIONS)).toBe(source);
    http.expectNone(() => true);
  });

  it.each(['INT-2026-032', 'inconnu'])(
    'garde Interventions actif sur le détail %s, y compris au menu mobile',
    async (id) => {
      await navigate(`/responsable/interventions/${id}?q=OUT&status=planned&assignee=AG-DEMO-001`);
      expect(element.querySelector('app-intervention-detail')).not.toBeNull();
      expect(element.querySelector('.app-bar h1, .screen-title')).toBeNull();
      const toggle = element.querySelector<HTMLButtonElement>('.menu-toggle')!;
      toggle.click();
      await fixture.whenStable();
      const active = element.querySelectorAll('nav a[aria-current="page"]');
      expect(active).toHaveLength(1);
      expect(active[0].getAttribute('href')).toBe('/responsable/interventions');
      http.expectNone(() => true);
    },
  );

  it('annonce et referme le menu Responsable après navigation', async () => {
    await navigate('/responsable');
    const toggle = element.querySelector<HTMLButtonElement>('.menu-toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe(element.querySelector('nav')?.id);
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    element.querySelector<HTMLAnchorElement>('nav a[href="/responsable/incidents"]')?.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(router.url).toBe('/responsable/incidents');
  });

  it('change d’espace sans afficher d’identité ou de synchronisation fictive', async () => {
    await navigate('/agent');
    element.querySelector<HTMLAnchorElement>('.space-links a[href="/responsable"]')?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/responsable');
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Navigation Responsable');
    expect(element.textContent).not.toMatch(/Synchronisé|Sophie Martin|Ville de Montfaucon/);
    http.expectNone('/api/v1/health');
  });
  it('limite les destinations principales Agent à Accueil, Matériel, Interventions et Plus', async () => {
    await navigate('/agent');
    expect(
      Array.from(element.querySelectorAll('nav > a'), (link) => link.textContent?.trim()),
    ).toEqual(['Accueil', 'Matériel', 'Interventions']);
    const toggle = element.querySelector<HTMLButtonElement>('.more-toggle')!;
    expect(toggle.textContent?.trim()).toBe('Plus');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const menu = element.querySelector('#agent-secondary-navigation')!;
    expect(toggle.getAttribute('aria-controls')).toBe(menu.id);
    expect(Array.from(menu.querySelectorAll('a'), (link) => link.getAttribute('href'))).toEqual([
      '/agent/scanner',
      '/agent/incidents',
      '/agent/profil',
    ]);
  });

  it.each([
    ['/agent/incidents', 'Signalements'],
    ['/agent/profil', 'Profil'],
    ['/agent/scanner', 'Scanner'],
  ])('signale dans Plus la rubrique active en accès direct : %s', async (url, label) => {
    await navigate(url);
    const toggle = element.querySelector<HTMLButtonElement>('.more-toggle')!;
    expect(toggle.classList.contains('active')).toBe(true);
    expect(toggle.getAttribute('aria-label')).toContain(label);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(
      element.querySelector('.secondary-links a[aria-current="page"]')?.getAttribute('href'),
    ).toBe(url);
    await navigate('/agent/equipements');
    expect(toggle.classList.contains('active')).toBe(false);
  });

  it('ferme Plus avec Échap ou Fermer et rend le focus au bouton', async () => {
    document.body.appendChild(element);
    await navigate('/agent');
    const toggle = element.querySelector<HTMLButtonElement>('.more-toggle')!;
    // jsdom ne résout pas les media queries : rendre visible le bouton mobile pour tester le focus.
    toggle.style.display = 'flex';
    toggle.click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
    toggle.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.close-more')?.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
    element.remove();
  });

  it('ferme Plus sur un appui extérieur et lorsque le focus quitte le groupe', async () => {
    await navigate('/agent');
    const toggle = element.querySelector<HTMLButtonElement>('.more-toggle')!;
    toggle.click();
    fixture.detectChanges();
    document.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    element
      .querySelector('.more-group')
      ?.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    element.querySelector('.more-group')?.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: element.querySelector('main'),
      }),
    );
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('navigue depuis Plus puis ferme le menu en plaçant le focus sur le contenu', async () => {
    document.body.appendChild(element);
    await navigate('/agent');
    const toggle = element.querySelector<HTMLButtonElement>('.more-toggle')!;
    toggle.click();
    fixture.detectChanges();
    element
      .querySelector<HTMLAnchorElement>('.secondary-links a[href="/agent/incidents"]')
      ?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/agent/incidents');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.classList.contains('active')).toBe(true);
    expect(document.activeElement).toBe(element.querySelector('main'));
    element.remove();
  });
  it.each([
    '/agent/interventions?q=OUT',
    '/agent/interventions/INT-2026-032?status=planned',
    '/agent/interventions/INT-2026-033',
    '/agent/interventions/inconnue',
  ])('garde Interventions active sans activer Plus : %s', async (url) => {
    await navigate(url);
    const active = element.querySelectorAll('nav a[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0].getAttribute('href')).toBe('/agent/interventions');
    expect(element.querySelector('.more-toggle')?.classList.contains('active')).toBe(false);
    expect(element.querySelector('.secondary-links a[href="/agent/scanner"]')).not.toBeNull();
  });
});
