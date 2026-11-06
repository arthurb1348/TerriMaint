import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DemoData } from '../../core/demo-data';
import { routes } from '../../app.routes';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { IncidentDeclaration } from './incident-declaration';

describe('Déclaration locale d’incident', () => {
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
  function heading(): string {
    return content().querySelector('h1')!.textContent!.replace(/\s+/g, ' ').trim();
  }
  function field(name: string): HTMLInputElement | HTMLTextAreaElement {
    return content().querySelector(`#incident-${name}`)!;
  }
  async function enter(name: string, value: string): Promise<void> {
    const input = field(name);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
  }
  async function choose(priority = 'high', risk = false): Promise<void> {
    content().querySelector<HTMLInputElement>(`#priority-${priority}`)!.click();
    if (risk) (field('risk') as HTMLInputElement).click();
    await harness.fixture.whenStable();
  }
  async function submit(): Promise<void> {
    content()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
  }
  async function click(text: string): Promise<void> {
    Array.from(content().querySelectorAll<HTMLButtonElement | HTMLAnchorElement>('button, a'))
      .find((control) => {
        const label = control.cloneNode(true) as HTMLElement;
        label.querySelectorAll('[aria-hidden="true"]').forEach((icon) => icon.remove());
        return label.textContent?.trim() === text;
      })!
      .click();
    await harness.fixture.whenStable();
  }
  async function fillValid(): Promise<void> {
    await enter('title', 'Le moteur cale');
    await enter('description', 'Le moteur cale lors de l’accélération.\nRedémarrage difficile.');
    await choose('high', true);
  }

  for (const space of ['agent', 'responsable']) {
    const base = `/${space}/incidents/nouveau`;
    it(`ouvre directement le formulaire partagé dans ${space}, avec le matériel identifié et aucune priorité préchoisie`, async () => {
      await harness.navigateByUrl(`${base}/EQ-OUT-0003`, IncidentDeclaration);
      expect(heading()).toBe('Déclarer un incident');
      expect(content().textContent).not.toContain('Données de démonstration');
      expect(content().textContent).not.toContain("Cette simulation n'enregistre et n'envoie rien");
      expect(content().textContent).not.toContain(
        'perdue en quittant cette page ou en la rechargeant',
      );
      expect(content().querySelector('.equipment-summary')?.textContent).toContain(
        'Débroussailleuse n°3',
      );
      expect(content().querySelector('.equipment-summary')?.textContent).toContain(
        'EQ-OUT-0003 · Atelier municipal',
      );
      expect(content().querySelectorAll('input[type="radio"]')).toHaveLength(3);
      expect(content().querySelector('input[type="radio"]:checked')).toBeNull();
      expect(content().textContent).not.toMatch(
        /Type d'incident|Synchronisé|Équipement immobilisé/,
      );
      expect(content().querySelector('a')!.getAttribute('href')).toBe(
        `/${space}/equipements/EQ-OUT-0003`,
      );
      expect(field('title').getAttribute('maxlength')).toBe('120');
      expect(field('description').getAttribute('maxlength')).toBe('2000');
    });

    it(`refuse un matériel inconnu dans ${space}, sans formulaire et avec retour à la recherche`, async () => {
      await harness.navigateByUrl(`${base}/absent?q=Souffleur`, IncidentDeclaration);
      expect(heading()).toBe('Équipement introuvable');
      expect(content().querySelector('form')).toBeNull();
      expect(content().querySelector('.equipment-summary')).toBeNull();
      expect(content().querySelector('a')!.getAttribute('href')).toBe(
        `/${space}/equipements?q=Souffleur`,
      );
    });

    it(`récapitule les valeurs exactes dans ${space}, permet leur modification puis termine sans mutation du matériel`, async () => {
      const sourceBefore = JSON.stringify(DEMO_EQUIPMENT);
      await harness.navigateByUrl(`${base}/EQ-OUT-0003?q=OUT`, IncidentDeclaration);
      await fillValid();
      await submit();
      expect(heading()).toBe('Vérifier le signalement');
      expect(Array.from(content().querySelectorAll('dd'), (item) => item.textContent)).toEqual([
        'Le moteur cale',
        'Le moteur cale lors de l’accélération.\nRedémarrage difficile.',
        'Haute — intervention rapide',
        'Oui',
      ]);
      expect(document.activeElement).toBe(content().querySelector('h1'));
      await click('Modifier le signalement');
      expect(field('title').value).toBe('Le moteur cale');
      expect(field('description').value).toContain('\nRedémarrage difficile.');
      expect(content().querySelector<HTMLInputElement>('#priority-high')!.checked).toBe(true);
      expect((field('risk') as HTMLInputElement).checked).toBe(true);
      expect(document.activeElement).toBe(field('title'));
      await enter('title', 'Le moteur cale à chaud');
      await choose('urgent');
      await submit();
      expect(content().querySelector('dd')?.textContent).toBe('Le moteur cale à chaud');
      expect(content().textContent).toContain('Urgente — danger immédiat');
      await click('Envoyer le signalement');
      expect(heading()).toBe('Signalement terminé');
      expect(content().querySelectorAll('a')).toHaveLength(3);
      const component = harness.routeDebugElement!.componentInstance as {
        complete(): void;
        edit(): void;
      };
      component.complete();
      component.edit();
      component.complete();
      const created = TestBed.inject(DemoData).incidents().at(-1)!;
      expect(TestBed.inject(DemoData).incidents()).toHaveLength(7);
      expect(created.title).toBe('Le moteur cale à chaud');
      expect(content().querySelector(`a[href="/${space}/incidents/${created.id}"]`)).not.toBeNull();
      expect(content().querySelector('form')).toBeNull();
      expect(JSON.stringify(DEMO_EQUIPMENT)).toBe(sourceBefore);
      expect(TestBed.inject(Router).url).toBe(`${base}/EQ-OUT-0003?q=OUT`);
      await click('Retour à la fiche');
      expect(TestBed.inject(Router).url).toBe(`/${space}/equipements/EQ-OUT-0003?q=OUT`);
    });

    it.each([
      ['vide', ''],
      ['blanche', '   \n  '],
      ['blanche au-delà de la borne des détails', ' '.repeat(2001)],
    ])(
      `accepte une description %s dans ${space} sans remplacer la saisie par le texte d'absence`,
      async (_label, description) => {
        await harness.navigateByUrl(`${base}/EQ-OUT-0003`, IncidentDeclaration);
        await enter('title', 'Bruit inhabituel');
        if (description) await enter('description', description);
        await choose('low');
        expect((field('description') as HTMLTextAreaElement).required).toBe(false);
        await submit();
        expect(heading()).toBe('Vérifier le signalement');
        expect(content().querySelectorAll('dd')[1].textContent).toBe('Non renseignée');
        expect(content().querySelector('.error')).toBeNull();
        await click('Modifier le signalement');
        expect(field('description').value).toBe(description);
        expect(field('title').value).toBe('Bruit inhabituel');
        expect(content().querySelector<HTMLInputElement>('#priority-low')!.checked).toBe(true);
        await enter('description', '  Un bruit est apparu.\nAu démarrage.  ');
        await submit();
        expect(content().querySelectorAll('dd')[1].textContent).toBe(
          '  Un bruit est apparu.\nAu démarrage.  ',
        );
        await click('Modifier le signalement');
        expect(field('description').value).toBe('  Un bruit est apparu.\nAu démarrage.  ');
      },
    );

    it.each(['form', 'review', 'complete'])(
      `efface saisie et étape en changeant de matériel dans la même instance de ${space} depuis %s`,
      async (step) => {
        const first = await harness.navigateByUrl(`${base}/EQ-OUT-0003`, IncidentDeclaration);
        await fillValid();
        if (step !== 'form') await submit();
        if (step === 'complete') await click('Envoyer le signalement');
        const second = await harness.navigateByUrl(`${base}/EQ-VEH-0042`, IncidentDeclaration);
        expect(second).toBe(first);
        expect(heading()).toBe('Déclarer un incident');
        expect(content().textContent).toContain('Fourgon de voirie');
        expect(content().textContent).not.toContain('Débroussailleuse');
        expect(field('title').value).toBe('');
        expect(field('description').value).toBe('');
        expect(content().querySelector('input[type="radio"]:checked')).toBeNull();
        expect((field('risk') as HTMLInputElement).checked).toBe(false);
        expect(content().querySelector('.error')).toBeNull();
        await harness.navigateByUrl(`${base}/absent`, IncidentDeclaration);
        expect(content().querySelector('form')).toBeNull();
        await harness.navigateByUrl(`${base}/EQ-OUT-0003`, IncidentDeclaration);
        expect(field('title').value).toBe('');
      },
    );

    it(`annule depuis le récapitulatif dans ${space} et transmet q sans perdre sa casse ni ses espaces`, async () => {
      const query = '  tONDeUSE  ';
      await harness.navigateByUrl(
        `${base}/EQ-OUT-0001?${new URLSearchParams({ q: query })}`,
        IncidentDeclaration,
      );
      await fillValid();
      await submit();
      await click('Annuler');
      expect(TestBed.inject(DemoData).incidents()).toHaveLength(6);
      const router = TestBed.inject(Router);
      expect(router.url.split('?')[0]).toBe(`/${space}/equipements/EQ-OUT-0001`);
      expect(router.parseUrl(router.url).queryParams['q']).toBe(query);
      await click('Retour au matériel');
      expect(content().querySelector<HTMLInputElement>('input')!.value).toBe(query);
      expect(content().querySelectorAll('li')).toHaveLength(1);
    });
  }

  it.each(['', '   \n  '])(
    'rejette un intitulé vide ou blanc (%j) et la priorité absente, tout en acceptant la description absente',
    async (value) => {
      await harness.navigateByUrl('/agent/incidents/nouveau/EQ-OUT-0003', IncidentDeclaration);
      await enter('title', value);
      await enter('description', value);
      await submit();
      expect(heading()).toBe('Déclarer un incident');
      expect(content().querySelectorAll('.error')).toHaveLength(2);
      expect(field('title').getAttribute('aria-invalid')).toBe('true');
      expect(field('title').getAttribute('aria-describedby')).toContain('title-error');
      expect(content().querySelector('#title-error')?.textContent).toContain('caractère autre');
      expect(content().querySelector('#priority-error')?.textContent).toContain('Choisissez');
      expect(field('description').getAttribute('aria-invalid')).toBe('false');
      expect(content().querySelector('#description-error')).toBeNull();
      expect(document.activeElement).toBe(field('title'));
    },
  );

  it('conserve la saisie lors du refus de priorité et focalise le groupe de choix', async () => {
    await harness.navigateByUrl('/agent/incidents/nouveau/EQ-OUT-0003', IncidentDeclaration);
    await enter('title', 'Une saisie conservée');
    await enter('description', 'Description valide');
    await submit();
    expect(field('title').value).toBe('Une saisie conservée');
    expect(field('description').value).toBe('Description valide');
    expect(content().querySelectorAll('.error')).toHaveLength(1);
    expect(document.activeElement?.id).toBe('priority-low');
    expect(document.activeElement?.getAttribute('aria-describedby')).toBe('priority-error');
  });

  it.each([
    ['title', 120, true],
    ['title', 121, false],
    ['description', 2000, true],
    ['description', 2001, false],
  ] as const)(
    'vérifie la borne %s à %i caractères (acceptée : %s), même si maxlength est contourné',
    async (name, length, valid) => {
      await harness.navigateByUrl('/agent/incidents/nouveau/EQ-OUT-0003', IncidentDeclaration);
      await fillValid();
      await enter(name, 'x'.repeat(length));
      await submit();
      expect(heading()).toBe(valid ? 'Vérifier le signalement' : 'Déclarer un incident');
      if (!valid) {
        expect(field(name).value).toHaveLength(length);
        expect(content().querySelector(`#${name}-error`)?.textContent).toContain(
          'ne doit pas dépasser',
        );
      }
    },
  );

  it.each([
    ['low', 'Basse — intervention à planifier'],
    ['high', 'Haute — intervention rapide'],
    ['urgent', 'Urgente — danger immédiat'],
  ])('accepte le choix explicite %s et le risque reste facultatif', async (value, label) => {
    await harness.navigateByUrl('/agent/incidents/nouveau/EQ-OUT-0003', IncidentDeclaration);
    await enter('title', 'Bruit');
    await enter('description', 'Bruit inhabituel observé.');
    await choose(value);
    await submit();
    expect(heading()).toBe('Vérifier le signalement');
    expect(content().textContent).toContain(label);
    expect(Array.from(content().querySelectorAll('dd')).at(-1)?.textContent).toBe('Non');
  });

  it('ne réinitialise pas la saisie pour q seul, mais la perd après départ et nouvelle ouverture', async () => {
    const base = '/agent/incidents/nouveau/EQ-OUT-0003';
    const first = await harness.navigateByUrl(base, IncidentDeclaration);
    await fillValid();
    expect(await harness.navigateByUrl(`${base}?q=OUT`, IncidentDeclaration)).toBe(first);
    expect(field('title').value).toBe('Le moteur cale');
    await click('Annuler');
    await harness.navigateByUrl(base, IncidentDeclaration);
    expect(field('title').value).toBe('');
    expect(content().querySelector('input[type="radio"]:checked')).toBeNull();
  });
});
