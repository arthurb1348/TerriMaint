import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../app.routes';
import { QrCamera } from './qr-camera';
import { Scanner } from './scanner';

describe.each(['agent', 'responsable'] as const)('Scanner %s', (space) => {
  let harness: RouterTestingHarness;
  const camera = { start: vi.fn(), stop: vi.fn() };
  let onValue: (value: string) => void;
  let onError: (message: string) => void;
  beforeEach(async () => {
    vi.resetAllMocks();
    camera.start.mockImplementation((_video, ready, value, error) => {
      onValue = value;
      onError = error;
      ready();
      return Promise.resolve();
    });
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    TestBed.overrideComponent(Scanner, {
      set: { providers: [{ provide: QrCamera, useValue: camera }] },
    });
    harness = await RouterTestingHarness.create(`/${space}/scanner`);
    harness.detectChanges();
  });
  afterEach(() => {
    harness.fixture.destroy();
    vi.restoreAllMocks();
  });
  const content = () => harness.routeNativeElement!;
  const submit = (reference: string) => {
    content().querySelector('input')!.value = reference;
    content()
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    harness.detectChanges();
  };
  const action = () => {
    content().querySelector<HTMLButtonElement>('button')!.click();
    harness.detectChanges();
  };

  it('garde la saisie disponible sans demander de permission', () => {
    expect(camera.start).not.toHaveBeenCalled();
    expect(content().querySelector('.back-link')?.getAttribute('href')).toBe(`/${space}`);
    expect(content().querySelector<HTMLElement>('.camera-preview')!.hidden).toBe(true);
    expect(content().querySelector('label')!.textContent).toContain('Référence du matériel');
    expect(content().querySelector('input')!.getAttribute('aria-describedby')).toContain(
      'reference-help',
    );
  });
  it('ouvre la fiche et conserve le parcours de déclaration', async () => {
    submit('  eq-veh-0042  ');
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe(`/${space}/equipements/EQ-VEH-0042`);
    expect(content().textContent).toContain('Fourgon de voirie');
    expect(content().querySelector('.declaration-link')!.getAttribute('href')).toBe(
      `/${space}/incidents/nouveau/EQ-VEH-0042`,
    );
    expect(camera.stop).toHaveBeenCalled();
  });
  it.each(['EQ-OUT-9999', 'https://evil.example', '<script>alert(1)</script>', ''])(
    'annonce %s et permet de corriger',
    (value) => {
      submit(value);
      expect(content().querySelector('[role=alert]')!.textContent).toMatch(/inconnue|invalide/);
      expect(content().querySelector('input')!.getAttribute('aria-invalid')).toBe('true');
      expect(content().querySelector('script')).toBeNull();
      expect(TestBed.inject(Router).url).toBe(`/${space}/scanner`);
      expect(content().querySelectorAll('[role=alert]')).toHaveLength(1);
      expect(content().querySelector('input')!.getAttribute('aria-describedby')).toContain(
        'reference-error',
      );
    },
  );
  it('ne navigue qu’une fois malgré les reconnaissances répétées et la saisie concurrente', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    action();
    onValue('EQ-OUT-0001');
    onValue('EQ-OUT-0001');
    submit('EQ-VEH-0042');
    expect(navigate).toHaveBeenCalledExactlyOnceWith([`/${space}/equipements`, 'EQ-OUT-0001']);
  });
  it.each(['EQ-OUT-9999', 'https://evil.example', '<img src=x onerror=alert(1)>', 'incorrect'])(
    'refuse le contenu QR non reconnu : %s',
    (value) => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
      action();
      onValue(value);
      harness.detectChanges();
      expect(navigate).not.toHaveBeenCalled();
      expect(content().querySelector('[role=alert]')!.textContent).toMatch(/inconnue|invalide/);
      expect(content().querySelector('img')).toBeNull();
      expect(content().querySelector('[role=status]')!.textContent).toBe('');
      expect(content().querySelector('#reference-error strong')!.textContent).toContain('Vérifiez');
    },
  );
  it('arrête, reprend et permet de corriger un QR inconnu', () => {
    action();
    expect(content().querySelector('button')!.textContent).toContain('Arrêter');
    action();
    expect(content().querySelector('button')!.textContent).toContain('Reprendre');
    expect(content().querySelector<HTMLElement>('.camera-preview')!.hidden).toBe(true);
    action();
    onValue('EQ-OUT-9999');
    harness.detectChanges();
    expect(content().querySelector('[role=alert]')!.textContent).toContain('inconnue');
    expect(content().querySelector('button')!.textContent).toContain('Reprendre');
    expect(camera.start).toHaveBeenCalledTimes(2);
  });
  it('nettoie au départ et ignore les résultats après destruction', async () => {
    action();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    await harness.navigateByUrl(`/${space}/equipements`);
    expect(camera.stop.mock.calls.length).toBeGreaterThanOrEqual(2);
    onValue('EQ-OUT-0001');
    expect(navigate).not.toHaveBeenCalled();
  });
  it('arrête sur pagehide sans reprise automatique', () => {
    action();
    window.dispatchEvent(new Event('pagehide'));
    harness.detectChanges();
    expect(content().querySelector('button')!.textContent).toContain('Reprendre');
    expect(camera.start).toHaveBeenCalledOnce();
  });
  it('permet de recommencer après navigation annulée', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(false);
    submit('EQ-OUT-0001');
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(content().querySelector('[role=status]')!.textContent).toContain('pas pu être ouverte');
    submit('EQ-VEH-0042');
    expect(navigate).toHaveBeenCalledTimes(2);
  });
  it('affiche le guide décoratif uniquement pendant le scan, puis le masque en erreur caméra', () => {
    const preview = content().querySelector<HTMLElement>('.camera-preview')!;
    const frame = preview.querySelector('.scan-frame')!;
    expect(frame.getAttribute('aria-hidden')).toBe('true');
    expect(frame.querySelectorAll('span')).toHaveLength(4);
    expect(frame.querySelector('a, button, [tabindex]')).toBeNull();
    action();
    expect(preview.hidden).toBe(false);
    expect(preview.textContent).toContain('Placez le QR code dans le cadre');
    onError('La caméra a été déconnectée.');
    harness.detectChanges();
    expect(preview.hidden).toBe(true);
    expect(content().querySelector('[role=status]')!.textContent).toContain('déconnectée');
  });

  it('suit les dimensions intrinsèques et leurs changements sans redémarrer la caméra', () => {
    const video = content().querySelector('video')!;
    const image = content().querySelector<HTMLElement>('.camera-image')!;
    action();
    for (const [width, height, event] of [
      [1280, 720, 'loadedmetadata'],
      [720, 1280, 'resize'],
      [0, 0, 'resize'],
    ] as const) {
      Object.defineProperty(video, 'videoWidth', { configurable: true, value: width });
      Object.defineProperty(video, 'videoHeight', { configurable: true, value: height });
      video.dispatchEvent(new Event(event));
      harness.detectChanges();
      expect(Number(image.style.getPropertyValue('--preview-ratio'))).toBe(
        width ? width / height : 720 / 1280,
      );
    }
    expect(camera.start).toHaveBeenCalledOnce();
  });

  it('actualise les liens et la destination après un changement d’espace', async () => {
    const otherSpace = space === 'agent' ? 'responsable' : 'agent';
    await harness.navigateByUrl(`/${otherSpace}/scanner`);
    expect(camera.start).not.toHaveBeenCalled();
    expect(content().querySelector('.back-link')?.getAttribute('href')).toBe(`/${otherSpace}`);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    action();
    onValue('EQ-OUT-0001');
    expect(navigate).toHaveBeenCalledExactlyOnceWith([`/${otherSpace}/equipements`, 'EQ-OUT-0001']);
  });
});
