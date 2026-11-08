import { test, expect, type Page, type TestInfo } from '@playwright/test';

const tilePattern = 'https://tile.openstreetmap.org/**';
// Une image locale décodable : la CI ne sollicite jamais le fournisseur.
const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e4ece8"/><path d="M0 128h256M128 0v256" stroke="white" stroke-width="12"/><text x="16" y="24" fill="#234e3f">Fond simulé</text></svg>`;

async function observe(page: Page) {
  const network: { url: string; method: string; type: string; referer?: string }[] = [];
  const errors: string[] = [];
  const messages: string[] = [];
  page.on('request', (request) =>
    network.push({
      url: request.url(),
      method: request.method(),
      type: request.resourceType(),
      referer: request.headers()['referer'],
    }),
  );
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => messages.push(message.text()));
  await page.addInitScript(() => {
    Object.assign(window, { mapGeolocationRequests: 0 });
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: () => {
          const state = window as unknown as { mapGeolocationRequests: number };
          state.mapGeolocationRequests++;
          throw new Error('La consultation ne doit pas demander la position');
        },
      },
    });
  });
  return { network, errors, messages };
}

async function navigateWithinApp(page: Page, path: string) {
  await page.evaluate((path) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
  await expect(page).toHaveURL(path);
}

async function assertPrivate(
  page: Page,
  observation: Awaited<ReturnType<typeof observe>>,
  info: TestInfo,
) {
  expect(observation.errors).toEqual([]);
  expect(observation.messages.join('\n')).not.toMatch(/48\.25|-1\.5/);
  for (const request of observation.network) {
    expect(request.url).not.toMatch(/48\.25|-1\.5|latitude|longitude/);
    if (new URL(request.url).hostname === 'tile.openstreetmap.org') {
      expect(request.method).toBe('GET');
      expect(request.type).toBe('image');
      expect(new URL(request.url).pathname).toMatch(/^\/16\/\d+\/\d+\.png$/);
      expect(new URL(request.url).search).toBe('');
      expect(request.referer).toBe('http://127.0.0.1:4173/');
    }
  }
  expect(
    await page.evaluate(
      () => (window as unknown as { mapGeolocationRequests: number }).mapGeolocationRequests,
    ),
  ).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await info.attach('requetes-observees-tuiles-interceptees', {
    body: JSON.stringify(observation.network, null, 2),
    contentType: 'application/json',
  });
  await info.attach('fiche-carte', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

for (const space of ['agent', 'responsable']) {
  test(`Carte ${space} : aucun fond avant le clic, marqueur centré, clavier et fiche réutilisée`, async ({
    page,
  }, info) => {
    const observation = await observe(page);
    await page.route(tilePattern, (route) =>
      route.fulfill({ contentType: 'image/svg+xml', body: tile }),
    );
    await page.goto(`/${space}/incidents/INC-2026-045`);
    const main = page.getByRole('main');
    const summary = main.locator('app-location-summary');
    const map = main.locator('app-incident-map');
    const action = map.getByRole('button');
    await expect(summary).toContainText('48.25');
    await expect(summary).toContainText('-1.5');
    await expect(action).toHaveText('Afficher la carte');
    await expect(map).toContainText('adresse IP');
    await expect(map).toContainText('zone affichée');
    expect(
      observation.network.filter(
        (request) => new URL(request.url).origin !== 'http://127.0.0.1:4173',
      ),
    ).toEqual([]);
    expect(observation.network.filter((request) => /leaflet/.test(request.url))).toEqual([]);
    // Le lien Matériel reste utilisable avant même de charger le fond.
    await expect(main.getByRole('link', { name: 'Voir le matériel', exact: true })).toBeVisible();
    await action.focus();
    await expect(action).toHaveCSS('outline-style', 'solid');
    await expect(action).toHaveCSS('outline-width', '3px');
    await page.keyboard.press('Enter');
    await expect(map.getByRole('status')).toHaveText(
      'Carte centrée sur la position jointe au signalement.',
    );
    await expect(action).toBeFocused();
    await expect(action).toHaveAttribute('aria-expanded', 'true');
    const marker = map.locator('.leaflet-marker-icon');
    await expect(marker).toBeVisible();
    await expect(marker).toHaveAttribute('alt', 'Position jointe au signalement');
    const markerBox = (await marker.boundingBox())!;
    const mapBox = (await map.locator('.map-canvas').boundingBox())!;
    // La pointe, ancrée en bas du marqueur, est sur le centre de la carte.
    expect(
      Math.abs(markerBox.x + markerBox.width / 2 - (mapBox.x + mapBox.width / 2)),
    ).toBeLessThan(2);
    expect(Math.abs(markerBox.y + markerBox.height - (mapBox.y + mapBox.height / 2))).toBeLessThan(
      2,
    );
    expect(
      observation.network.filter((request) =>
        request.url.startsWith('https://tile.openstreetmap.org/'),
      ).length,
    ).toBeGreaterThan(0);
    const attribution = map.getByRole('link', { name: 'OpenStreetMap', exact: true });
    await expect(attribution).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(attribution).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(main.getByRole('link', { name: 'Voir le matériel', exact: true })).toBeFocused();
    await assertPrivate(page, observation, info);

    await page
      .locator('app-incident-detail')
      .evaluate((element) => element.setAttribute('data-reuse-proof', 'yes'));
    const before = observation.network.length;
    await navigateWithinApp(page, `/${space}/incidents/INC-2026-046`);
    await expect(page.locator('app-incident-detail')).toHaveAttribute('data-reuse-proof', 'yes');
    await expect(summary).toHaveText('Aucune localisation ajoutée.');
    await expect(map.getByRole('button')).toHaveCount(0);
    await expect(map.locator('.leaflet-marker-icon')).toHaveCount(0);
    await navigateWithinApp(page, `/${space}/incidents/INC-2026-045`);
    await expect(action).toHaveText('Afficher la carte');
    await expect(action).toHaveAttribute('aria-expanded', 'false');
    expect(
      observation.network
        .slice(before)
        .filter((request) => request.url.startsWith('https://tile.openstreetmap.org/')),
    ).toEqual([]);
  });

  test(`Carte ${space} : panne du fond, coordonnées et autres actions conservées, relance au clavier`, async ({
    page,
  }, info) => {
    const observation = await observe(page);
    await page.route(tilePattern, (route) => route.abort('failed'));
    await page.goto(`/${space}/incidents/INC-2026-045`);
    const main = page.getByRole('main');
    const map = main.locator('app-incident-map');
    const action = map.getByRole('button');
    await action.focus();
    await page.keyboard.press('Space');
    await expect(map.getByRole('status')).toContainText('Le fond de carte est indisponible.');
    await expect(main.locator('app-location-summary')).toContainText('48.25');
    await expect(main.locator('app-location-summary')).toContainText('Précision : 12 m');
    await expect(action).toHaveText('Réessayer la carte');
    await expect(action).toBeFocused();
    await expect(map.getByRole('img')).toHaveCount(0);
    await expect(main.getByRole('link', { name: 'Voir le matériel', exact: true })).toBeVisible();
    if (space === 'responsable')
      await expect(
        main.getByRole('button', { name: 'Clôturer le signalement', exact: true }),
      ).toBeEnabled();
    await assertPrivate(page, observation, info);
    await page.route(tilePattern, (route) =>
      route.fulfill({ contentType: 'image/svg+xml', body: tile }),
    );
    await page.keyboard.press('Enter');
    await expect(map.getByRole('status')).toContainText('Carte centrée');
    await expect(map.locator('.leaflet-marker-icon')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(action).toHaveText('Afficher la carte');
    await expect(action).toBeFocused();
    await navigateWithinApp(page, `/${space}/incidents/INC-2026-046`);
    await navigateWithinApp(page, `/${space}/incidents/INC-2026-045`);
    await expect(action).toHaveText('Afficher la carte');
  });

  test(`Carte ${space} : fiche sans position, aucune requête ni action cartographique`, async ({
    page,
  }, info) => {
    const observation = await observe(page);
    await page.route(tilePattern, (route) => route.abort('failed'));
    await page.goto(`/${space}/incidents/INC-2026-046`);
    const main = page.getByRole('main');
    await expect(main.locator('app-location-summary')).toHaveText('Aucune localisation ajoutée.');
    await expect(main.locator('app-incident-map button')).toHaveCount(0);
    await expect(main.locator('.map-canvas')).toHaveCount(0);
    await expect(main.getByRole('link', { name: 'Voir le matériel', exact: true })).toBeVisible();
    expect(
      observation.network.filter(
        (request) => new URL(request.url).origin !== 'http://127.0.0.1:4173',
      ),
    ).toEqual([]);
    expect(observation.network.filter((request) => /leaflet/.test(request.url))).toEqual([]);
    await assertPrivate(page, observation, info);
  });
}
