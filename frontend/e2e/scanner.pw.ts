import { expect, test, type Page } from '@playwright/test';

// Permissions et capteur simulés. Le PNG et le décodeur jsQR sont réels.
async function installCamera(
  page: Page,
  mode = 'image',
  reference = 'EQ-OUT-0001',
  dimensions = { width: 300, height: 300 },
) {
  await page.addInitScript(
    ({ mode, reference, dimensions }) => {
      const state = {
        requests: 0,
        stops: 0,
        release: () => undefined as void,
        resize: undefined as ((width: number, height: number) => void) | undefined,
        showQR: async () => {
          /* La scène change seulement après les vérifications du guide. */
        },
      };
      Object.assign(window, { cameraTest: state });
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        configurable: true,
        value: async () => {
          state.requests++;
          if (['denied', 'absent', 'busy'].includes(mode))
            throw new DOMException(
              'simulated',
              mode === 'denied'
                ? 'NotAllowedError'
                : mode === 'busy'
                  ? 'NotReadableError'
                  : 'NotFoundError',
            );
          const canvas = document.createElement('canvas');
          canvas.width = dimensions.width;
          canvas.height = dimensions.height;
          const context = canvas.getContext('2d')!;
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);
          if (mode === 'image') {
            const image = new Image();
            image.src = `/qr-demo/${reference}.png`;
            await image.decode();
            context.drawImage(image, 0, 0, 300, 300);
          }
          const stream = canvas.captureStream(5);
          // Les scènes modifiées doivent émettre une image même sans rafraîchissement du canvas dans le DOM.
          const captureTrack = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
          state.resize = (width, height) => {
            canvas.width = width;
            canvas.height = height;
            context.fillStyle = 'white';
            context.fillRect(0, 0, width, height);
            captureTrack.requestFrame();
          };
          state.showQR = async () => {
            const image = new Image();
            image.src = `/qr-demo/${reference}.png`;
            await image.decode();
            context.drawImage(image, 0, 0, 120, 120);
            captureTrack.requestFrame();
          };
          stream.getTracks().forEach((track) => {
            const stop = track.stop.bind(track);
            track.stop = () => {
              state.stops++;
              stop();
            };
          });
          if (mode === 'late')
            await new Promise<void>((resolve) => {
              state.release = resolve;
            });
          return stream;
        },
      });
    },
    { mode, reference, dimensions },
  );
}
async function stats(page: Page) {
  return page.evaluate(() => {
    const state = (window as unknown as { cameraTest: { requests: number; stops: number } })
      .cameraTest;
    return { requests: state.requests, stops: state.stops };
  });
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}

test('Saisie clavier, erreur annoncée, focus visible et fiche Agent', async ({ page }, info) => {
  await installCamera(page, 'denied');
  await page.goto('/agent/scanner');
  const input = page.getByLabel('Référence du matériel', { exact: true });
  expect((await stats(page)).requests).toBe(0);
  await input.focus();
  await page.keyboard.type('EQ-OUT-9999');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alert')).toContainText('inconnue');
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  const focus = await input.evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: style.outlineWidth, style: style.outlineStyle };
  });
  expect(focus).toEqual({ width: '3px', style: 'solid' });
  await input.scrollIntoViewIfNeeded();
  await noOverflow(page);
  await info.attach('scanner-focus', { body: await page.screenshot(), contentType: 'image/png' });
  for (const value of [
    'https://example.org/EQ-OUT-0001',
    '<img src=x onerror=alert(1)>',
    'EQ-OUT-1',
  ]) {
    await input.fill(value);
    await input.press('Enter');
    await expect(page.getByRole('alert')).toContainText('invalide');
    await expect(page).toHaveURL(/\/agent\/scanner$/);
    await noOverflow(page);
  }
  await input.fill('  eq-veh-0042  ');
  await input.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fourgon de voirie');
  await page.getByRole('link', { name: 'Faire un signalement', exact: true }).click();
  await expect(page.getByLabel('Intitulé', { exact: true })).toBeVisible();
  expect((await stats(page)).requests).toBe(0);
});
for (const [reference, title] of [
  ['EQ-OUT-0001', 'Tondeuse autoportée'],
  ['EQ-VEH-0042', 'Fourgon de voirie'],
  ['EQ-OUT-9999', ''],
] as const) {
  test(`Décodage réel PNG ${reference}, flux caméra simulé`, async ({ page }, info) => {
    await installCamera(page, 'image', reference);
    await page.goto('/agent/scanner');
    let navigations = 0;
    page.on('framenavigated', () => {
      if (page.url().includes('/equipements/')) navigations++;
    });
    expect((await stats(page)).requests).toBe(0);
    await page.getByRole('button', { name: 'Démarrer la caméra', exact: true }).click();
    if (title) {
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
      await expect(page).toHaveURL(new RegExp(`/agent/equipements/${reference}$`));
      expect(navigations).toBe(1);
    } else {
      await expect(page.getByRole('alert')).toContainText('inconnue');
      await expect(page.getByRole('status')).toHaveText('');
      await expect(page.getByRole('alert')).toHaveCount(1);
      await expect(page.getByRole('alert')).toHaveCSS('border-left-width', '6px');
      await expect(page.getByRole('alert')).toContainText('Corrigez la saisie');
      await expect(
        page.getByRole('button', { name: 'Reprendre la caméra', exact: true }),
      ).toBeVisible();
      await expect(page.getByLabel('Référence du matériel', { exact: true })).toBeFocused();
      expect(navigations).toBe(0);
    }
    expect((await stats(page)).stops).toBe(1);
    await expect(page.locator('.scan-frame')).not.toBeVisible();
    await info.attach(`decode-${reference}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await noOverflow(page);
  });
}
for (const mode of ['denied', 'absent', 'busy']) {
  test(`Caméra ${mode} simulée : secours manuel`, async ({ page }) => {
    await installCamera(page, mode);
    await page.goto('/agent/scanner');
    await page.getByRole('button', { name: 'Démarrer la caméra', exact: true }).click();
    await expect(page.getByRole('status')).toContainText(
      mode === 'denied' ? 'refusé' : mode === 'busy' ? 'occupée' : 'Aucune caméra',
    );
    await page.getByLabel('Référence du matériel', { exact: true }).fill('EQ-OUT-0001');
    await page.getByRole('button', { name: 'Ouvrir la fiche matériel', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tondeuse autoportée');
  });
}
test('Arrêt, reprise et nettoyage au départ (flux simulé sans QR)', async ({ page }) => {
  await installCamera(page, 'blank');
  await page.goto('/agent/scanner');
  await page.getByRole('button', { name: 'Démarrer la caméra', exact: true }).click();
  const stop = page.getByRole('button', { name: 'Arrêter la caméra', exact: true });
  await expect(stop).toBeFocused();
  await expect(page.locator('.scan-frame')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.scan-frame')).toBeHidden();
  expect((await stats(page)).stops).toBe(1);
  await expect(
    page.getByRole('button', { name: 'Reprendre la caméra', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(stop).toBeVisible();
  await page.getByRole('link', { name: 'Retour à l’accueil Agent', exact: true }).click();
  expect((await stats(page)).requests).toBe(2);
  expect((await stats(page)).stops).toBe(2);
  expect(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
  ).toEqual({ local: 0, session: 0 });
});
for (const action of ['cancel', 'leave', 'manual']) {
  test(`Permission tardive après ${action} : aucun flux survivant`, async ({ page }) => {
    await installCamera(page, 'late');
    await page.goto('/agent/scanner');
    await page.getByRole('button', { name: 'Démarrer la caméra', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Annuler la demande caméra', exact: true }),
    ).toBeVisible();
    if (action === 'cancel')
      await page.getByRole('button', { name: 'Annuler la demande caméra', exact: true }).click();
    else if (action === 'leave')
      await page.getByRole('link', { name: 'Retour à l’accueil Agent', exact: true }).click();
    else {
      await page.getByLabel('Référence du matériel', { exact: true }).fill('EQ-VEH-0042');
      await page.getByRole('button', { name: 'Ouvrir la fiche matériel', exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fourgon de voirie');
    }
    await expect(page.locator('.scan-frame')).not.toBeVisible();
    await page.evaluate(() =>
      (window as unknown as { cameraTest: { release: () => void } }).cameraTest.release(),
    );
    await expect.poll(async () => (await stats(page)).stops).toBe(1);
    await expect(page).toHaveURL(
      action === 'cancel'
        ? /\/agent\/scanner$/
        : action === 'leave'
          ? /\/agent$/
          : /\/agent\/equipements\/EQ-VEH-0042$/,
    );
  });
}

test('Contexte non sécurisé simulé : aucune permission, saisie disponible', async ({ page }) => {
  await installCamera(page, 'denied');
  await page.addInitScript(() =>
    Object.defineProperty(window, 'isSecureContext', { value: false }),
  );
  await page.goto('/agent/scanner');
  await page.getByRole('button', { name: 'Démarrer la caméra', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('HTTPS');
  expect((await stats(page)).requests).toBe(0);
  await page.getByLabel('Référence du matériel', { exact: true }).fill('EQ-OUT-0001');
  await page.getByRole('button', { name: 'Ouvrir la fiche matériel', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tondeuse autoportée');
});

test('Erreurs distinctes près du scan, association et correction sans navigation', async ({
  page,
}, info) => {
  await page.goto('/agent/scanner');
  const input = page.getByLabel('Référence du matériel', { exact: true });
  const error = page.getByRole('alert');
  for (const [value, expected] of [
    ['https://example.org', 'Référence invalide.'],
    ['EQ-OUT-9999', 'Référence inconnue.'],
  ]) {
    await input.fill(value);
    await input.press('Enter');
    await expect(error).toContainText(expected);
    await expect(error).toContainText('reprenez la caméra');
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute('aria-describedby', 'reference-help reference-error');
    await expect(error).toBeInViewport({ ratio: 1 });
    await expect(input).toBeInViewport({ ratio: 1 });
    const nav = await page.getByRole('navigation', { name: 'Navigation Agent' }).boundingBox();
    const inputBounds = await input.boundingBox();
    expect(inputBounds!.y + inputBounds!.height).toBeLessThanOrEqual(nav!.y);
    await expect(page.locator('[role=alert]')).toHaveCount(1);
    const position = await error.evaluate((el) => ({
      insideIdentification: Boolean(el.closest('form')),
      beforeInput: Boolean(
        el.compareDocumentPosition(document.querySelector('#equipment-reference')!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    }));
    expect(position).toEqual({ insideIdentification: true, beforeInput: true });
    const open = page.getByRole('button', { name: 'Ouvrir la fiche matériel', exact: true });
    await input.press('Tab');
    await expect(open).toBeFocused();
    const openBounds = await open.boundingBox();
    expect(openBounds!.y + openBounds!.height).toBeLessThanOrEqual(nav!.y);
    await input.focus();
    await info.attach(expected, { body: await page.screenshot(), contentType: 'image/png' });
    await noOverflow(page);
  }
  await input.fill('EQ-OUT-0001');
  await input.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tondeuse autoportée');
});

test('Le cadre décoratif suit portrait, paysage, bandes et redimensionnement sans déborder', async ({
  page,
}, info) => {
  await installCamera(page, 'blank', 'EQ-OUT-0001', { width: 1280, height: 720 });
  await page.goto('/agent/scanner');
  const frame = page.locator('.scan-frame');
  await expect(frame).toBeHidden();
  expect((await stats(page)).requests).toBe(0);
  await page.getByRole('button', { name: 'Démarrer la caméra', exact: true }).click();
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute('aria-hidden', 'true');
  await expect(frame).toHaveCSS('pointer-events', 'none');
  await expect(frame.locator('span')).toHaveCount(4);
  await expect(frame.locator('a, button, [tabindex]')).toHaveCount(0);
  await expect(page.locator('.scan-instruction')).toHaveText('Placez le QR code dans le cadre');
  for (const [width, height] of [
    [1280, 720],
    [720, 1280],
    [1600, 400],
  ]) {
    await page.evaluate(
      ({ width, height }) => {
        (
          window as unknown as { cameraTest: { resize: (width: number, height: number) => void } }
        ).cameraTest.resize(width, height);
      },
      { width, height },
    );
    await expect
      .poll(() =>
        page.locator('video').evaluate((element) => {
          const video = element as HTMLVideoElement;
          return video.videoWidth / video.videoHeight;
        }),
      )
      .toBeCloseTo(width / height, 4);
    await expect
      .poll(async () => {
        const image = (await page.locator('video').boundingBox())!;
        const guide = (await frame.boundingBox())!;
        return (
          Math.abs(image.width / image.height - width / height) < 0.01 &&
          guide.x >= image.x &&
          guide.y >= image.y &&
          guide.x + guide.width <= image.x + image.width &&
          guide.y + guide.height <= image.y + image.height &&
          Math.abs(guide.width - guide.height) < 1
        );
      })
      .toBe(true);
    if (width < height) {
      const image = (await page.locator('video').boundingBox())!;
      const outer = (await page.locator('.camera-preview').boundingBox())!;
      expect(outer.width - image.width).toBeGreaterThan(1);
    }
    await page
      .locator('.camera-preview')
      .evaluate((element) => element.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => scrollBy(0, -16));
    const preview = (await page.locator('.camera-preview').boundingBox())!;
    const navigation = (await page.getByRole('navigation', { name: 'Navigation Agent' }).boundingBox())!;
    expect(preview.y + preview.height).toBeLessThanOrEqual(navigation.y);
    await noOverflow(page);
    await info.attach(`cadre-${width}-${height}`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  }
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: viewport.height, height: viewport.width });
  await expect(frame).toBeVisible();
  await noOverflow(page);
  await page.setViewportSize(viewport);
  const stop = page.getByRole('button', { name: 'Arrêter la caméra', exact: true });
  await stop.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Référence du matériel', { exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(stop).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(frame).toBeHidden();
  expect((await stats(page)).stops).toBe(1);
});

test('Un QR reconnu hors du cadre ouvre encore la fiche avec le décodeur réel', async ({
  page,
}) => {
  await installCamera(page, 'blank', 'EQ-OUT-0001', { width: 640, height: 480 });
  await page.goto('/agent/scanner');
  await page.getByRole('button', { name: 'Démarrer la caméra', exact: true }).click();
  const frame = page.locator('.scan-frame');
  await expect(frame).toBeVisible();
  const video = (await page.locator('video').boundingBox())!;
  const guide = (await frame.boundingBox())!;
  expect(((guide.x - video.x) / video.width) * 640).toBeGreaterThan(120);
  await page.evaluate(() =>
    (window as unknown as { cameraTest: { showQR: () => Promise<void> } }).cameraTest.showQR(),
  );
  await expect(page).toHaveURL(/\/agent\/equipements\/EQ-OUT-0001$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tondeuse autoportée');
  await expect(frame).toHaveCount(0);
  expect((await stats(page)).stops).toBe(1);
});

test('La carte de scan est un lien natif sans demande de caméra avant activation explicite', async ({
  page,
  context,
}, info) => {
  await installCamera(page, 'blank');
  await page.goto('/agent');
  await expect(page.getByRole('main')).toContainText('Pour Camille Durand');
  await expect(page.locator('.preview-link')).toHaveCount(2);
  await expect(
    page.getByRole('link', { name: 'Voir toutes mes interventions', exact: true }),
  ).toBeVisible();
  expect((await stats(page)).requests).toBe(0);
  if (page.viewportSize()!.width >= 1200) await page.setViewportSize({ width: 1199, height: 1024 });
  const card = page.getByRole('main').getByRole('link', { name: 'Scanner', exact: true });
  await expect(card).toHaveAttribute('href', '/agent/scanner');
  await expect(card).toHaveAccessibleName('Scanner');
  await expect(card.locator('img')).toHaveAttribute('alt', '');
  await expect(card.locator('a, button, [tabindex]')).toHaveCount(0);
  const bounds = (await card.boundingBox())!;
  expect(bounds.height).toBeGreaterThanOrEqual(96);
  expect(bounds.height).toBeLessThanOrEqual(128);
  await card.focus();
  await expect(card).toBeFocused();
  await expect(card).toHaveCSS('outline-width', '3px');
  await info.attach('carte-scanner-focus', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  const popupPromise = context.waitForEvent('page');
  await card.click({ position: { x: 8, y: 8 }, modifiers: ['ControlOrMeta'] });
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/\/agent\/scanner$/);
  await expect(
    popup.getByRole('button', { name: 'Démarrer la caméra', exact: true }),
  ).toBeVisible();
  // Si une requête était lancée au chargement, le statut initial serait remplacé.
  await expect(popup.getByRole('status')).toContainText('Caméra arrêtée');
  await popup.close();
  await expect(page).toHaveURL(/\/agent$/);
  expect((await stats(page)).requests).toBe(0);
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/agent\/scanner$/);
  await expect(page.getByRole('button', { name: 'Démarrer la caméra', exact: true })).toBeVisible();
  expect((await stats(page)).requests).toBe(0);
});

for (const space of ['agent', 'responsable'] as const) {
  test(`Accès Scanner permanent, seuil et fiche dans le bon espace — ${space}`, async ({
    page,
  }, info) => {
    await installCamera(page);
    await page.goto(`/${space}`);
    const initialWidth = page.viewportSize()!.width;
    if (initialWidth >= 1200) await page.setViewportSize({ width: 1199, height: 1024 });
    const navigation = page.getByRole('navigation', {
      name: `Navigation ${space === 'agent' ? 'Agent' : 'Responsable'}`,
    });
    if (initialWidth <= 760) {
      if (space === 'agent') {
        await expect(navigation.locator(':scope > a')).toHaveText([
          'Accueil',
          'Matériel',
          'Interventions',
        ]);
        const plus = navigation.getByRole('button', { name: /^Plus/ });
        await plus.click();
        await page.keyboard.press('Escape');
        await expect(plus).toBeFocused();
        await expect(plus).toHaveAttribute('aria-expanded', 'false');
        await plus.click();
      } else await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
    }
    const link = navigation.getByRole('link', { name: 'Scanner', exact: true });
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(`/${space}/scanner`);
    await expect(page.getByRole('main')).toBeFocused();
    if (space === 'agent' && initialWidth <= 760) {
      await expect(
        navigation.getByRole('button', { name: 'Plus — Scanner actif', exact: true }),
      ).toHaveAttribute('aria-expanded', 'false');
    }
    expect((await stats(page)).requests).toBe(0);
    await expect(page.locator(`nav a[href="/${space}/scanner"]`)).toHaveAttribute(
      'aria-current',
      'page',
    );
    const main = page.getByRole('main');
    await expect(main.locator('.back-link')).toHaveAttribute('href', `/${space}`);
    await main.getByRole('button', { name: 'Démarrer la caméra', exact: true }).click();
    await expect(page).toHaveURL(`/${space}/equipements/EQ-OUT-0001`);
    expect((await stats(page)).stops).toBe(1);

    await page.goto(`/${space}/scanner`);
    for (const width of [1199, 1200, 1201, 1199]) {
      await page.setViewportSize({ width, height: 1024 });
      await expect(link).toBeVisible({ visible: width < 1200 });
      await expect(main.getByLabel('Référence du matériel', { exact: true })).toBeVisible();
      expect((await stats(page)).requests).toBe(0);
      await noOverflow(page);
    }
    await page.setViewportSize({ width: initialWidth, height: info.project.use.viewport!.height });
    await main.getByLabel('Référence du matériel', { exact: true }).fill('eq-veh-0042');
    await info.attach(`scanner-${space}-acces`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await main.getByRole('button', { name: 'Ouvrir la fiche matériel', exact: true }).click();
    await expect(page).toHaveURL(`/${space}/equipements/EQ-VEH-0042`);
    await expect(
      main.getByRole('link', { name: 'Faire un signalement', exact: true }),
    ).toHaveAttribute('href', `/${space}/incidents/nouveau/EQ-VEH-0042`);
  });
}
