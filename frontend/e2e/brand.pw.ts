import { expect, test } from '@playwright/test';

for (const route of ['/', '/agent', '/responsable']) {
  test(`marque discrète, navigation native et titre de page long : ${route}`, async ({ page }, info) => {
    await page.route('**/api/v1/health', (request) => request.fulfill({ json: { status: 'ok' } }));
    await page.goto(route);
    const sidebar = route === '/responsable' && info.project.use.viewport!.width > 760;
    const headerBrand = page.getByRole('link', {
      name: 'TerriMaint — Accueil général',
      exact: true,
    });
    const organization = page.locator('.organization');
    const brand = sidebar ? organization : headerBrand;
    await expect(brand).toBeVisible();
    await expect(sidebar ? page.locator('.brand-link') : organization).toBeHidden();
    await expect(page.locator('.brand-link:visible, .organization:visible')).toHaveCount(1);
    await expect(brand).toHaveAttribute('href', sidebar ? '/responsable' : '/');
    if (!sidebar) await expect(brand).toHaveAccessibleName('TerriMaint — Accueil général');
    for (const image of await brand.locator('img').all())
      await expect(image).toHaveAttribute('alt', '');
    const image = brand.locator('img:visible');
    await expect(image).toHaveCount(1);
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    const dimensions = await image.evaluate((img: HTMLImageElement) => ({
      width: img.clientWidth,
      height: img.clientHeight,
      ratio: img.naturalWidth / img.naturalHeight,
    }));
    expect(dimensions.width / dimensions.height).toBeCloseTo(dimensions.ratio, 1);
    const target = await brand.boundingBox();
    expect(target!.width).toBeGreaterThanOrEqual(44);
    expect(target!.height).toBeGreaterThanOrEqual(44);
    if (!sidebar && info.project.use.viewport!.width < 640) {
      expect(dimensions.width).toBe(28);
      expect(dimensions.height).toBe(28);
    }
    await info.attach('marque', { body: await page.screenshot(), contentType: 'image/png' });

    // Le titre de page est remplacé seulement dans le DOM pour éprouver les textes longs.
    await expect(page.locator('.screen-title')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const title = page.getByRole('heading', { level: 1 });
    await title.evaluate((node) => {
      node.textContent = 'Interventions et maintenance des équipements municipaux';
    });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1);
    const barBounds = await page.locator('.app-bar').boundingBox();
    expect(barBounds!.height).toBeLessThanOrEqual(65);
    if (!sidebar) {
      const brandBounds = await brand.boundingBox();
      const menuBounds = await page.locator('.space-menu').boundingBox();
      expect(
        menuBounds!.x + menuBounds!.width <= brandBounds!.x ||
          brandBounds!.x + brandBounds!.width <= menuBounds!.x,
      ).toBe(true);
    }
    await info.attach('titre-long', { body: await page.screenshot(), contentType: 'image/png' });

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    await page.goto(route);
    for (let index = 0; index < 8; index++) {
      await page.keyboard.press('Tab');
      if (await brand.evaluate((node) => node === document.activeElement)) break;
    }
    await expect(brand).toBeFocused();
    expect(await brand.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe('solid');
    const popupPromise = page.context().waitForEvent('page');
    await brand.click({ modifiers: ['ControlOrMeta'] });
    const popup = await popupPromise;
    await expect(popup).toHaveURL(sidebar ? /\/responsable$/ : /\/$/);
    await popup.close();
    await brand.press('Enter');
    await expect(page).toHaveURL(sidebar ? '/responsable' : '/');

    await page.locator('.space-menu summary').click();
    await page.getByRole('link', { name: 'Espace Responsable', exact: true }).click();
    await expect(page).toHaveURL('/responsable');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tableau de bord');
    await expect(page.locator('.brand-link:visible, .organization:visible')).toHaveCount(1);
  });
}

test('marque adaptée au redimensionnement et favicon fourni', async ({ page }) => {
  await page.route('**/api/v1/health', (request) => request.fulfill({ json: { status: 'ok' } }));
  await page.goto('/agent');
  for (const width of [639, 671, 672, 688, 768, 1440, 320]) {
    await page.setViewportSize({ width, height: 1024 });
    const horizontal = width - (width <= 760 ? 32 : 48) >= 640;
    await expect(page.locator(horizontal ? '.brand-horizontal' : '.brand-symbol')).toBeVisible();
    await expect(page.locator(horizontal ? '.brand-symbol' : '.brand-horizontal')).toBeHidden();
    await expect(page.locator('.brand-link')).toHaveAccessibleName('TerriMaint — Accueil général');
  }
  await page.goto('/responsable');
  for (const width of [768, 760, 1440, 390]) {
    await page.setViewportSize({ width, height: 1024 });
    await expect(page.locator('.brand-link:visible, .organization:visible')).toHaveCount(1);
    await expect(
      page.locator(
        width > 760 ? '.organization' : width >= 672 ? '.brand-horizontal' : '.brand-symbol',
      ),
    ).toBeVisible();
  }
  for (const type of ['image/svg+xml', 'image/x-icon']) {
    const href = await page.locator(`link[rel="icon"][type="${type}"]`).getAttribute('href');
    const response = await page.request.get(href!);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain(type === 'image/x-icon' ? 'image/' : type);
  }
});
