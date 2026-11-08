import { expect, test, type Locator, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/health', (route) => route.fulfill({ json: { status: 'ok' } }));
});

async function contextCardLinks(page: Page, expectedCount: number) {
  await expect(page.locator('main .single-destination')).toHaveCount(expectedCount);
  const original = page.url();
  for (const card of await page.locator('main .single-destination').all()) {
    const link = card.getByRole('link');
    await expect(link).toHaveCount(1);
    const href = await link.getAttribute('href');
    const popupPromise = page.context().waitForEvent('page');
    await card.click({ position: { x: 6, y: 6 }, modifiers: ['ControlOrMeta'] });
    const popup = await popupPromise;
    await expect(popup).toHaveURL(new URL(href!, page.url()).href);
    await popup.close();
    expect(page.url()).toBe(original);
  }
}

async function focusVisible(page: Page, link: Locator, card: Locator, space: string) {
  await link.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(link).toBeFocused();
  const styled = await card.evaluate((el) => {
    const link = el.querySelector('a')!;
    const style = getComputedStyle(link);
    return style.outlineStyle === 'solid' ? style.outlineWidth : getComputedStyle(el).outlineWidth;
  });
  expect(parseFloat(styled)).toBeGreaterThanOrEqual(3);
  const bounds = await link.boundingBox();
  expect(bounds).not.toBeNull();
  if (space === 'agent') {
    const nav = await page.getByRole('navigation', { name: 'Navigation Agent' }).boundingBox();
    if (nav) expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(nav.y);
  }
}

for (const space of ['agent', 'responsable']) {
  for (const domain of ['equipements', 'incidents']) {
    test(`Surface, lien natif, clavier et retour exact — ${space}/${domain}`, async ({ page, context }, info) => {
      const q = domain === 'equipements' ? '  tONDeUSE  ' : '  moteur  ';
      const filters: Record<string, string> = domain === 'incidents' ? { q, priority: 'low', status: 'open' } : { q };
      const query = new URLSearchParams(filters).toString();
      const path = `/${space}/${domain}`;
      await page.goto(`${path}?${query}`);
      const main = page.getByRole('main');
      const card = main.locator(domain === 'equipements' ? '.equipment-list li' : 'tbody tr').first();
      const link = card.getByRole('link');
      await expect(link).toHaveAccessibleName(domain === 'equipements' ? 'Tondeuse autoportée' : /INC-.*Moteur/i);
      expect(await card.locator('a, button').count()).toBe(1);
      expect(await card.locator('a a, a button').count()).toBe(0);
      await link.scrollIntoViewIfNeeded();
      const href = await link.getAttribute('href');
      await card.hover({ position: { x: 6, y: 6 } });
      // Le fond teinté distingue la surface au survol, même lorsque la cible est une marge.
      if (domain === 'equipements') await expect(link).toHaveCSS('background-color', 'rgb(228, 236, 232)');
      else if (await card.evaluate(el => getComputedStyle(el).display !== 'table-row'))
        await expect(card).toHaveCSS('background-color', 'rgb(228, 236, 232)');
      expect(new URL(href!, 'http://localhost').searchParams.get('q')).toBe(q);
      // Ctrl/Cmd-clic sur la marge active le lien du navigateur et laisse la liste ouverte.
      const popupPromise = context.waitForEvent('page');
      if (await card.evaluate(el => getComputedStyle(el).display === 'table-row'))
        await link.click({ modifiers: ['ControlOrMeta'] });
      else await card.click({ position: { x: 6, y: 6 }, modifiers: ['ControlOrMeta'] });
      const popup = await popupPromise;
      await popup.waitForLoadState();
      await expect(popup).toHaveURL(new URL(href!, page.url()).href);
      await expect(page).toHaveURL(new RegExp(`${path}\\?`));
      await popup.close();
      await focusVisible(page, link, card, space);
      await info.attach('carte-focus', { body: await page.screenshot(), contentType: 'image/png' });
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new URL(href!, page.url()).href);
      await page.reload();
      if (domain === 'incidents') await contextCardLinks(page, 1);
      await main.getByRole('link', { name: domain === 'equipements' ? 'Retour au matériel' : 'Retour aux signalements', exact: true }).click();
      expect(new URL(page.url()).searchParams.get('q')).toBe(q);
      if (domain === 'incidents') {
        await expect(main.getByLabel('Priorité', { exact: true })).toHaveValue('low');
        await expect(main.getByLabel('Statut du signalement', { exact: true })).toHaveValue('open');
      }
      await expect(card).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    });
  }
}

test('Interventions : surface en cartes, tableau conservé, filtres et actions indépendantes', async ({ page, context }, info) => {
  const q = '  alimentation  ';
  const query = new URLSearchParams({ q, status: 'planned', assignee: 'AG-DEMO-001' });
  await page.goto(`/responsable/interventions?${query}`);
  const main = page.getByRole('main');
  const card = main.locator('tbody tr').first();
  const link = card.getByRole('link');
  await expect(link).toBeVisible();
  const table = await card.evaluate(el => getComputedStyle(el).display === 'table-row');
  const href = await link.getAttribute('href');
  const popupPromise = context.waitForEvent('page');
  if (table) await link.click({ modifiers: ['ControlOrMeta'] });
  else await card.click({ position: { x: 6, y: 6 }, modifiers: ['ControlOrMeta'] });
  const popup = await popupPromise;
  await expect(popup).toHaveURL(new URL(href!, page.url()).href);
  await popup.close();
  await focusVisible(page, link, card, 'responsable');
  await page.keyboard.press('Enter');
  await expect(main.getByRole('heading', { level: 1 })).toContainText(/alimentation/i);
  await contextCardLinks(page, 2);
  const original = page.url();
  // Le résumé sans destination n'est pas transformé en lien ; les origines restent indépendantes.
  await expect(main.locator('.intervention-summary a')).toHaveCount(0);
  await main.locator('.intervention-summary').click();
  expect(page.url()).toBe(original);
  await expect(main.getByRole('link', { name: 'Voir le signalement', exact: true })).toHaveAttribute('href', /\/responsable\/incidents\/INC-/);
  await expect(main.getByRole('link', { name: 'Voir le matériel', exact: true })).toHaveAttribute('href', /\/responsable\/equipements\/EQ-/);
  await info.attach('intervention-origines', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await main.getByRole('link', { name: 'Retour aux interventions', exact: true }).click();
  await expect(main.getByLabel('Rechercher une intervention')).toHaveValue(q);
  await expect(main.getByLabel('Statut de l’intervention')).toHaveValue('planned');
  await expect(main.getByLabel('Agent affecté', { exact: true })).toHaveValue('AG-DEMO-001');
});

test('Responsable : indicateurs métier et changement d’espace uniquement dans le shell', async ({ page }) => {
  await page.goto('/responsable');
  const main = page.getByRole('main');
  await expect(main.getByRole('link')).toHaveCount(8);
  await expect(main.locator('.indicators').getByRole('link')).toHaveCount(3);
  await expect(main.getByRole('link', { name: /Agent|Scanner/ })).toHaveCount(0);
  const spaceToggle = page.locator('.space-menu summary');
  await expect(spaceToggle).toHaveAccessibleName('Changer d’espace');
  await spaceToggle.click();
  await page.getByRole('link', { name: 'Espace Agent', exact: true }).click();
  await expect(page).toHaveURL(/\/agent$/);
});


test('Le texte des cellules reste sélectionnable sans navigation parasite', async ({ page }) => {
  await page.goto('/agent/incidents');
  const cell = page.getByRole('main').locator('tbody tr').first().locator('td').first();
  await cell.scrollIntoViewIfNeeded();
  const bounds = await cell.boundingBox();
  expect(bounds).not.toBeNull();
  const original = page.url();
  await page.mouse.move(bounds!.x + 2, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width - 2, bounds!.y + bounds!.height / 2, { steps: 15 });
  await page.mouse.up();
  expect(await page.evaluate(() => window.getSelection()?.toString().length)).toBeGreaterThan(0);
  expect(page.url()).toBe(original);
});
