import { test, expect, type Page } from '@playwright/test';

async function installAudio(page: Page, denied = false) {
  await page.addInitScript(
    ({ denied }) => {
      const stats = { requests: 0, stops: 0, chunks: 0, types: [] as string[] };
      Object.assign(window, { audioStats: stats });
      const Recorder = window.MediaRecorder;
      window.MediaRecorder = class extends Recorder {
        constructor(stream: MediaStream, options?: MediaRecorderOptions) {
          super(stream, options);
          stats.types.push(this.mimeType);
          this.addEventListener('dataavailable', (event) => {
            if (event.data.size) stats.chunks++;
          });
        }
      };
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            stats.requests++;
            if (denied) throw new DOMException('Refus simulé', 'NotAllowedError');
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const destination = context.createMediaStreamDestination();
            oscillator.connect(destination);
            oscillator.start();
            await context.resume();
            const stream = destination.stream;
            for (const track of stream.getTracks()) {
              const stop = track.stop.bind(track);
              track.stop = () => {
                if (track.readyState === 'live') {
                  stats.stops++;
                  stop();
                  oscillator.stop();
                  void context.close();
                }
              };
            }
            return stream;
          },
        },
      });
    },
    { denied },
  );
}
async function stats(page: Page) {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          audioStats: { requests: number; stops: number; chunks: number; types: string[] };
        }
      ).audioStats,
  );
}
async function capture(page: Page) {
  await page.getByRole('button', { name: 'Enregistrer une note vocale', exact: true }).click();
  await expect(page.getByText(/Microphone actif —/)).toBeVisible();
  await expect.poll(async () => (await stats(page)).chunks).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Arrêter l’enregistrement', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Supprimer la note vocale', exact: true }),
  ).toBeVisible();
}

for (const space of ['agent', 'responsable']) {
  test(`Note vocale simulée : réécouter, modifier, confirmer et consulter — ${space}`, async ({
    page,
  }, info) => {
    await installAudio(page);
    await page.goto(`/${space}/incidents/nouveau/EQ-OUT-0001?q=tondeuse`);
    const main = page.getByRole('main');
    expect((await stats(page)).requests).toBe(0);
    await capture(page);
    expect((await stats(page)).stops).toBe(1);
    const player = main.locator('audio');
    const src = await player.getAttribute('src');
    await expect(player).not.toHaveAttribute('autoplay');
    await player.evaluate(async (audio: HTMLAudioElement) => {
      await audio.play();
    });
    await expect
      .poll(() => player.evaluate((audio: HTMLAudioElement) => audio.currentTime))
      .toBeGreaterThan(0);
    await main.getByLabel('Intitulé', { exact: true }).fill('Note vocale de démonstration');
    await main.getByRole('radio', { name: /Basse/ }).check();
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await expect(player).toHaveAttribute('src', src!);
    await main.getByRole('button', { name: 'Modifier le signalement', exact: true }).click();
    await expect(player).toHaveAttribute('src', src!);
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
    await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
    await expect(page).toHaveURL(/\/incidents\/INC-LOCAL-/);
    await expect(player).toHaveAttribute('src', src!);
    await player.evaluate(async (audio: HTMLAudioElement) => {
      await audio.play();
    });
    await expect
      .poll(() => player.evaluate((audio: HTMLAudioElement) => audio.currentTime))
      .toBeGreaterThan(0);
    expect((await stats(page)).types[0]).toMatch(/^audio\//);
    await info.attach('format-audio-simule', {
      body: JSON.stringify(await stats(page)),
      contentType: 'application/json',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await info.attach('note-vocale', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
}

test('Suppression, nouvel enregistrement et départ arrêtent le micro simulé', async ({ page }) => {
  await installAudio(page);
  await page.goto('/agent/incidents/nouveau/EQ-OUT-0001');
  await capture(page);
  await page.getByRole('button', { name: 'Supprimer la note vocale', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Enregistrer une note vocale', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Enregistrer une note vocale', exact: true }).click();
  await expect(page.getByText(/Microphone actif —/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Vérifier le signalement', exact: true }),
  ).toBeDisabled();
  await page.getByRole('link', { name: 'Annuler', exact: true }).click();
  await expect.poll(async () => (await stats(page)).stops).toBe(2);
  await page.getByRole('link', { name: 'Faire un signalement', exact: true }).click();
  await expect(page.getByText('Aucune note vocale ajoutée.', { exact: true })).toBeVisible();
});

test('Refus simulé du micro : confirmer sans note en conservant les autres saisies', async ({
  page,
}) => {
  await installAudio(page, true);
  await page.goto('/responsable/incidents/nouveau/EQ-OUT-0001');
  const main = page.getByRole('main');
  await main.getByLabel('Intitulé', { exact: true }).fill('Sans note vocale');
  await main.getByRole('button', { name: 'Enregistrer une note vocale', exact: true }).click();
  await expect(main).toContainText('Accès au microphone refusé');
  await main.getByRole('radio', { name: /Basse/ }).check();
  await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
  await expect(main).toContainText('Aucune note vocale ajoutée.');
  await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
  await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
  await expect(main).toContainText('Aucune note vocale ajoutée.');
});

test('La limite de 60 secondes arrête automatiquement la capture simulée', async ({ page }) => {
  await installAudio(page);
  await page.goto('/agent/incidents/nouveau/EQ-OUT-0001');
  await page.clock.install();
  await page.getByRole('button', { name: 'Enregistrer une note vocale', exact: true }).click();
  await expect(page.getByText(/Microphone actif —/)).toBeVisible();
  await expect.poll(async () => (await stats(page)).chunks).toBeGreaterThan(0);
  await page.clock.fastForward(60000);
  await expect(
    page.getByRole('button', { name: 'Supprimer la note vocale', exact: true }),
  ).toBeVisible();
  expect((await stats(page)).stops).toBe(1);
});
