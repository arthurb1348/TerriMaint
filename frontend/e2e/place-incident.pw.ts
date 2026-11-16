import { expect, test, type Page } from '@playwright/test';

async function installSensors(page: Page, mode: 'absent' | 'refused' | 'joined') {
  await page.addInitScript(
    ({ mode }) => {
      const stats = { gps: 0, microphone: 0, stopped: 0 };
      Object.assign(window, { placeSensorStats: stats });
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value:
          mode === 'absent'
            ? undefined
            : {
                getCurrentPosition: (success: PositionCallback, error: PositionErrorCallback) => {
                  stats.gps++;
                  if (mode === 'refused') error({ code: 1 } as GeolocationPositionError);
                  else
                    success({
                      coords: { latitude: 48.25, longitude: -1.5, accuracy: 12 },
                    } as GeolocationPosition);
                },
              },
      });
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            stats.microphone++;
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
                  stats.stopped++;
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
    { mode },
  );
}

async function responsibleList(page: Page) {
  if (page.viewportSize()!.width <= 760)
    await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Navigation Responsable', exact: true })
    .getByRole('link', { name: 'Signalements', exact: true })
    .click();
}

for (const mode of ['absent', 'refused', 'joined'] as const) {
  test(`Lieu : Agent → Modifier → Responsable → clôture, GPS ${mode}`, async ({ page }, info) => {
    await installSensors(page, mode);
    const errors: string[] = [];
    const writes: string[] = [];
    const tiles: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url());
      if (request.url().startsWith('https://tile.openstreetmap.org/')) tiles.push(request.url());
    });
    await page.route('https://tile.openstreetmap.org/**', (route) =>
      route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e4ece8"/><text x="12" y="24">Fond simulé</text></svg>',
      }),
    );
    await page.goto('/agent/incidents');
    const main = page.getByRole('main');
    await expect(main.locator('tbody tr')).toHaveCount(6);
    const initialCount = await main.locator('tbody tr').count();
    const entry = main.getByRole('link', { name: 'Nouveau signalement', exact: true });
    await entry.focus();
    await expect(entry).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/agent/incidents/nouveau');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Nouveau signalement');
    await expect(main.locator('.equipment-summary')).toHaveCount(0);
    const originalPlace = '  Rue des Écoles, près du portail  ';
    const place = '  Rue des Écoles, entrée nord  ';
    const title = `Barrière endommagée ${mode}`;
    await main.getByLabel('Lieu (obligatoire)', { exact: true }).fill(originalPlace);
    await main.getByLabel('Intitulé', { exact: true }).fill(title);
    await main.getByRole('radio', { name: /Urgente/ }).check();
    await main
      .getByLabel("Je signale un risque ou une impossibilité d'utilisation", { exact: true })
      .check();
    expect(
      await page.evaluate(
        () => (window as unknown as { placeSensorStats: { gps: number } }).placeSensorStats.gps,
      ),
    ).toBe(0);
    await main.getByRole('button', { name: 'Utiliser ma position', exact: true }).click();
    await expect(main).toContainText(
      mode === 'joined'
        ? 'Position obtenue.'
        : mode === 'refused'
          ? 'Autorisation de localisation refusée.'
          : 'La localisation n’est pas disponible',
    );
    let photo: string | null = null;
    let audio: string | null = null;
    if (mode === 'joined') {
      await main.locator('#gallery-file').setInputFiles('public/images/demo/mower.webp');
      await expect(main.locator('#photos-status')).toContainText('1 photo(s)');
      photo = await main.locator('.photo-gallery img').getAttribute('src');
      await main.getByRole('button', { name: 'Enregistrer une note vocale', exact: true }).click();
      await expect(main.getByText(/Microphone actif — [1-9]/)).toBeVisible();
      await main.getByRole('button', { name: 'Arrêter l’enregistrement', exact: true }).click();
      await expect(
        main.getByRole('button', { name: 'Supprimer la note vocale', exact: true }),
      ).toBeVisible();
      audio = await main.locator('audio').getAttribute('src');
    }
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await expect(main.locator('.review-values')).toContainText(originalPlace.trim());
    await main.getByRole('button', { name: 'Modifier le signalement', exact: true }).click();
    await expect(main.getByLabel('Lieu (obligatoire)', { exact: true })).toHaveValue(originalPlace);
    await expect(main.getByLabel('Intitulé', { exact: true })).toHaveValue(title);
    if (photo) await expect(main.locator('.photo-gallery img')).toHaveAttribute('src', photo);
    if (audio) await expect(main.locator('audio')).toHaveAttribute('src', audio);
    await main.getByLabel('Lieu (obligatoire)', { exact: true }).fill(place);
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await expect(main.locator('.review-values')).toContainText(place.trim());
    await main
      .getByRole('button', { name: 'Envoyer le signalement', exact: true })
      .evaluate((button) => {
        (button as HTMLButtonElement).click();
        (button as HTMLButtonElement).click();
      });
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalement terminé');
    await expect(main.locator('.return-link')).toHaveAttribute('href', '/agent/incidents');
    const viewIncident = main.getByRole('link', { name: 'Voir le signalement', exact: true });
    const incidentPath = (await viewIncident.getAttribute('href'))!;
    await viewIncident.click();
    await expect(page).toHaveURL(incidentPath);
    await expect(main.locator('.place-summary')).toContainText(place.trim());
    await expect(main.locator('.metadata')).toContainText('Ouvert');
    await expect(main.getByRole('link', { name: 'Voir le matériel', exact: true })).toHaveCount(0);
    await expect(
      main.getByRole('button', { name: 'Clôturer le signalement', exact: true }),
    ).toHaveCount(0);
    if (mode === 'joined') {
      await expect(main.locator('app-location-summary')).toContainText('48.25');
      expect(tiles).toEqual([]);
      await main.getByRole('button', { name: 'Afficher la carte', exact: true }).click();
      await expect(main.locator('.leaflet-marker-icon')).toBeVisible();
      expect(tiles.length).toBeGreaterThan(0);
      await expect(main.locator('.photo-gallery img')).toHaveAttribute('src', photo!);
      await expect(main.locator('audio')).toHaveAttribute('src', audio!);
      await main.locator('audio').evaluate(async (player: HTMLAudioElement) => {
        await player.play();
      });
      await expect
        .poll(() =>
          main.locator('audio').evaluate((player: HTMLAudioElement) => player.currentTime),
        )
        .toBeGreaterThan(0);
    } else {
      await expect(main.locator('app-location-summary')).toHaveText('Aucune localisation ajoutée.');
      await expect(
        main.getByRole('button', { name: 'Afficher la carte', exact: true }),
      ).toHaveCount(0);
      expect(tiles).toEqual([]);
    }
    await main.getByRole('link', { name: 'Retour aux signalements', exact: true }).click();
    await expect(main.locator('tbody tr')).toHaveCount(initialCount + 1);
    await main.getByRole('searchbox').fill('  ÉCOLES  ');
    await expect(main.locator('tbody tr')).toHaveCount(1);
    await expect(main.locator('tbody')).toContainText(place.trim());
    await main.locator('tbody a').click();
    // Le changement d’espace reste une navigation Angular dans le même onglet.
    await page.locator('.space-menu > summary').click();
    await page.getByRole('link', { name: 'Espace Responsable', exact: true }).click();
    await expect(page).toHaveURL('/responsable');
    const preview = main.locator('[aria-labelledby="dashboard-incidents-title"]');
    await expect(preview).toContainText(place.trim());
    await preview.getByRole('link', { name: new RegExp(title) }).click();
    await expect(page).toHaveURL(incidentPath.replace('/agent/', '/responsable/'));
    await expect(main).not.toContainText('Matériel introuvable');
    await expect(
      main.getByRole('link', { name: 'Programmer une intervention', exact: true }),
    ).toHaveCount(1);
    if (photo) await expect(main.locator('.photo-gallery img')).toHaveAttribute('src', photo);
    if (audio) await expect(main.locator('audio')).toHaveAttribute('src', audio);
    await info.attach(`lieu-${mode}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await main.getByRole('button', { name: 'Clôturer le signalement', exact: true }).click();
    await main.getByRole('button', { name: 'Annuler', exact: true }).click();
    await expect(main.locator('.metadata')).toContainText('Ouvert');
    await main.getByRole('button', { name: 'Clôturer le signalement', exact: true }).click();
    await main.getByRole('button', { name: 'Clôturer le signalement', exact: true }).click();
    await expect(main.locator('.metadata')).toContainText('Clôturé');
    await expect(
      main.getByRole('status').filter({ hasText: 'Le signalement est maintenant clôturé.' }),
    ).toBeFocused();
    await responsibleList(page);
    await main.getByRole('searchbox').fill('ÉCOLES');
    await expect(main.locator('tbody tr')).toHaveCount(1);
    await expect(main.locator('tbody')).toContainText('Clôturé');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(
        () =>
          (
            window as unknown as {
              placeSensorStats: { gps: number; microphone: number; stopped: number };
            }
          ).placeSensorStats,
      ),
    ).toEqual({
      gps: mode === 'absent' ? 0 : 1,
      microphone: mode === 'joined' ? 1 : 0,
      stopped: mode === 'joined' ? 1 : 0,
    });
    await page.reload();
    await main.getByRole('searchbox').fill('ÉCOLES');
    await expect(main.locator('tbody tr')).toHaveCount(0);
  });
}

test('Lieu obligatoire : vide, espaces, intitulé, priorité, clavier et annulation', async ({
  page,
}, info) => {
  await page.goto('/agent/incidents?q=écoles&priority=urgent&status=open');
  const main = page.getByRole('main');
  await main.getByRole('link', { name: 'Nouveau signalement', exact: true }).click();
  const place = main.getByLabel('Lieu (obligatoire)', { exact: true });
  for (const value of ['', '   ']) {
    await place.fill(value);
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await expect(place).toBeFocused();
    await expect(place).toHaveAttribute('aria-invalid', 'true');
    await expect(main.locator('#place-error')).toContainText('pas seulement des espaces');
  }
  await place.fill('Rue des Écoles');
  await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
  await expect(main.getByLabel('Intitulé', { exact: true })).toBeFocused();
  await main.getByLabel('Intitulé', { exact: true }).fill('Barrière endommagée');
  await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
  await expect(main.getByRole('radio', { name: /Basse/ })).toBeFocused();
  await place.focus();
  await page.keyboard.press('Tab');
  await expect(main.getByLabel('Intitulé', { exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await info.attach('formulaire-lieu', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  await main.getByRole('link', { name: 'Retour aux signalements', exact: true }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === '/agent/incidents' &&
      url.searchParams.get('q') === 'écoles' &&
      url.searchParams.get('priority') === 'urgent' &&
      url.searchParams.get('status') === 'open',
  );
  await page.goto('/agent/incidents/nouveau/inconnu');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Équipement introuvable');
  await expect(main.locator('form')).toHaveCount(0);
});
