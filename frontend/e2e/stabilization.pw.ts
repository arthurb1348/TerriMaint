import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}

async function agentNavigationFits(page: Page) {
  const navigation = page.getByRole('navigation', { name: 'Navigation Agent', exact: true });
  const bounds = (await navigation.boundingBox())!;
  for (const control of await navigation.locator('a:visible, .more-toggle:visible').all()) {
    const box = (await control.boundingBox())!;
    const text = await control.locator('span').last().evaluate(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
    expect(text.left).toBeGreaterThanOrEqual(box.x - 1);
    expect(text.right).toBeLessThanOrEqual(box.x + box.width + 1);
    expect(text.top).toBeGreaterThanOrEqual(box.y);
    expect(text.bottom).toBeLessThanOrEqual(box.y + box.height);
  }
  const reserved = await page.locator('.shell').evaluate(node => parseFloat(getComputedStyle(node).paddingBottom));
  expect(reserved).toBeGreaterThanOrEqual(bounds.height);
}

async function confirmation(page: Page, view: Locator, back: Locator, info: TestInfo) {
  const main = page.getByRole('main');
  await expect(main.getByRole('link')).toHaveCount(2);
  await expect(main.locator('.actions > a')).toHaveCount(2);
  await expect(main.getByRole('heading', { level: 1 })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(view).toBeFocused();
  await expect(view).toHaveCSS('outline-style', 'solid');
  const navigation = page.getByRole('navigation', { name: 'Navigation Agent', exact: true });
  if (await navigation.count()) {
    const button = (await view.boundingBox())!;
    const bar = (await navigation.boundingBox())!;
    expect(button.y + button.height + 4).toBeLessThanOrEqual(bar.y);
  }
  await page.keyboard.press('Tab');
  await expect(back).toBeFocused();
  await expect(back).toHaveCSS('outline-style', 'solid');
  await expect(back).toBeInViewport({ ratio: 1 });
  if (await navigation.count()) {
    const button = (await back.boundingBox())!;
    const bar = (await navigation.boundingBox())!;
    expect(button.y + button.height + 4).toBeLessThanOrEqual(bar.y);
  }
  const first = (await view.boundingBox())!;
  const second = (await back.boundingBox())!;
  expect(Math.max(second.x - first.x - first.width, second.y - first.y - first.height)).toBeGreaterThanOrEqual(11);
  for (const box of [first, second]) {
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
  await noOverflow(page);
  await info.attach('confirmation-actions', { body: await page.screenshot(), contentType: 'image/png' });
}

for (const space of ['agent', 'responsable']) {
  for (const origin of ['place', 'equipment']) {
    test(`Retours uniques et confirmation groupée : ${space}, ${origin}`, async ({ page }, info) => {
      const query: Record<string, string> = origin === 'place'
        ? { q: '  absent  ', priority: 'low', status: 'closed' }
        : { q: '  tONDeUSE  ' };
      const path = `/${space}/incidents/nouveau${origin === 'place' ? '' : '/EQ-OUT-0001'}`;
      const destination = `/${space}/${origin === 'place' ? 'incidents' : 'equipements/EQ-OUT-0001'}`;
      await page.goto(`${path}?${new URLSearchParams(query)}`);
      const main = page.getByRole('main');
      const backName = origin === 'place' ? 'Retour aux signalements' : 'Retour à la fiche matériel';
      const back = main.getByRole('link', { name: backName, exact: true });
      await expect(back).toHaveCount(1);
      await expect(main.getByRole('link', { name: 'Annuler', exact: true })).toHaveCount(0);
      await expect(main).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(back).toBeFocused();
      await expect(back).toHaveCSS('outline-style', 'solid');
      if (origin === 'place') await main.getByLabel('Lieu (obligatoire)', { exact: true }).fill('Rue des Écoles, entrée nord du bâtiment municipal');
      await main.getByLabel('Intitulé', { exact: true }).fill('Barrière et portail à contrôler avant la prochaine ouverture');
      await main.getByRole('radio', { name: /Haute/ }).check();
      await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
      await expect(main.getByRole('heading', { level: 1 })).toBeFocused();
      await expect(back).toHaveCount(1);
      await expect(main.getByRole('link', { name: 'Annuler', exact: true })).toHaveCount(0);
      await expect(main.locator('.actions > button')).toHaveCount(2);
      await main.getByRole('button', { name: 'Modifier le signalement', exact: true }).click();
      await expect(main.getByLabel('Intitulé', { exact: true })).toHaveValue('Barrière et portail à contrôler avant la prochaine ouverture');
      await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
      await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
      const view = main.getByRole('link', { name: 'Voir le signalement', exact: true });
      await confirmation(page, view, back, info);
      expect(await view.getAttribute('href')).toMatch(new RegExp(`^/${space}/incidents/INC-LOCAL-[^?]+$`));
      const target = new URL((await back.getAttribute('href'))!, page.url());
      expect(target.pathname).toBe(destination);
      expect(Object.fromEntries(target.searchParams)).toEqual(query);
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(target.href);
      await expect(main).toBeFocused();
      if (origin === 'place') {
        await expect(main.getByRole('searchbox')).toHaveValue(query['q']);
        await expect(main.locator('tbody tr')).toHaveCount(0);
      } else {
        await main.getByRole('link', { name: 'Retour au matériel', exact: true }).click();
        await expect(main.getByRole('searchbox')).toHaveValue(query['q']);
      }
    });
  }

  test(`Texte agrandi, espacements et paysage : ${space}`, async ({ page }, info) => {
    await page.goto(`/${space}/incidents/nouveau`);
    await page.addStyleTag({ content: ':root { font-size: 200%; } * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
    expect(await page.locator('html').evaluate(node => getComputedStyle(node).fontSize)).toBe('32px');
    const main = page.getByRole('main');
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await expect(main.getByLabel('Lieu (obligatoire)', { exact: true })).toBeFocused();
    await main.getByLabel('Lieu (obligatoire)', { exact: true }).fill('Rue des Écoles, près de la mairie');
    await main.getByLabel('Intitulé', { exact: true }).fill('Contrôle des accès du bâtiment communal');
    await main.getByRole('radio', { name: /Urgente/ }).check();
    await noOverflow(page);
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await noOverflow(page);
    await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
    await confirmation(page, main.getByRole('link', { name: 'Voir le signalement', exact: true }), main.getByRole('link', { name: 'Retour aux signalements', exact: true }), info);
    if (space === 'agent') await agentNavigationFits(page);
    await page.keyboard.press('Tab');
    const privacy = page.getByRole('contentinfo').getByRole('link', { name: 'Confidentialité', exact: true });
    await expect(privacy).toBeFocused();
    await expect(privacy).toBeInViewport({ ratio: 1 });
    if (space === 'agent' && page.viewportSize()!.width <= 760) {
      const footerLink = (await privacy.boundingBox())!;
      const bar = (await page.getByRole('navigation', { name: 'Navigation Agent', exact: true }).boundingBox())!;
      expect(footerLink.y + footerLink.height).toBeLessThanOrEqual(bar.y);
      const more = page.getByRole('button', { name: /^Plus/ });
      await more.focus();
      await page.keyboard.press('Enter');
      await expect(more).toHaveAttribute('aria-expanded', 'true');
      await expect(page.getByRole('navigation', { name: 'Navigation Agent', exact: true }).getByRole('link', { name: 'Scanner', exact: true })).toBeVisible();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('navigation', { name: 'Navigation Agent', exact: true }).getByRole('link', { name: 'Scanner', exact: true })).toBeFocused();
      const popup = (await page.locator('.secondary-links').boundingBox())!;
      const border = await page.getByRole('navigation', { name: 'Navigation Agent', exact: true }).evaluate(node => parseFloat(getComputedStyle(node).borderTopWidth));
      expect(popup.y).toBeGreaterThanOrEqual(0);
      expect(popup.y + popup.height).toBeLessThanOrEqual(bar.y + border);
      await page.keyboard.press('Escape');
      await expect(more).toBeFocused();
      await privacy.focus();
    }
    await page.setViewportSize({ width: 844, height: 390 });
    await noOverflow(page);
    const back = main.getByRole('link', { name: 'Retour aux signalements', exact: true });
    await page.keyboard.press('Shift+Tab');
    await expect(back).toBeFocused();
    await expect(back).toBeInViewport({ ratio: 1 });
    await expect(back).toHaveCSS('outline-style', 'solid');
    await info.attach('texte-agrandi-paysage', { body: await page.screenshot(), contentType: 'image/png' });
    await back.press('Enter');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalements');
    await noOverflow(page);
  });
}

test('Tableaux et cartes : titres et lieux sur plusieurs lignes', async ({ page }, info) => {
  for (const collection of ['incidents', 'interventions']) {
    await page.goto(`/responsable/${collection}`);
    const main = page.getByRole('main');
    const row = main.locator('tbody tr').first();
    // Textes remplacés dans le DOM uniquement pour éprouver la présentation, sans altérer DemoData.
    await row.locator('th a').evaluate(node => { node.textContent = 'Contrôle des accès et réparation de la barrière du bâtiment municipal avant ouverture'; });
    await row.locator('td').first().evaluate(node => { node.append(' — Rue des Écoles, entrée nord du bâtiment municipal près de la cour'); });
    const tableMode = await main.locator('table').evaluate(node => getComputedStyle(node).display === 'table');
    if (tableMode) {
      for (const cell of await row.locator('th,td').all()) await expect(cell).toHaveCSS('vertical-align', 'middle');
      const title = (await row.locator('th a').boundingBox())!;
      const badge = (await row.locator('.badge').last().boundingBox())!;
      expect(title.height).toBeGreaterThan(50);
      expect(Math.abs(title.y + title.height / 2 - badge.y - badge.height / 2)).toBeLessThan(2);
    } else {
      await expect(row.locator('.cell-label').first()).toBeVisible();
      await row.locator('th a').focus();
      await expect(row).toHaveCSS('outline-style', 'solid');
    }
    await noOverflow(page);
    await info.attach(`${collection}-multiligne`, { body: await page.screenshot(), contentType: 'image/png' });
  }
});

test('Diagnostic #33 : recherche native, profils vierges avec et sans émulation tactile', async ({ browser, page }, info) => {
  const observations: object[] = [];
  for (const touch of [false, true]) {
    const context = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: page.viewportSize()!, deviceScaleFactor: 1, isMobile: touch, hasTouch: touch, locale: 'fr-FR' });
    try {
      const searchPage = await context.newPage();
      await searchPage.goto('/agent/equipements');
      const main = searchPage.getByRole('main');
      const search = main.getByRole('searchbox');
      await expect(main.locator('li')).toHaveCount(6);
      await search.fill('  tONDeUSE  ');
      await expect(main.locator('li')).toHaveCount(1);
      await expect(main.locator('li')).toContainText('Tondeuse');
      await expect(search).not.toHaveAttribute('list');
      await expect(search).not.toHaveAttribute('autocomplete', 'off');
      await expect(main.getByRole('listbox')).toHaveCount(0);
      await expect(searchPage.locator('datalist')).toHaveCount(0);
      await search.focus();
      await searchPage.keyboard.press('Tab');
      await searchPage.keyboard.press('Shift+Tab');
      await expect(search).toBeFocused();
      await expect(search).toHaveCSS('outline-style', 'solid');
      await noOverflow(searchPage);
      observations.push(await searchPage.evaluate(touch => ({ touch, browser: navigator.userAgent, viewport: innerWidth, scale: visualViewport?.scale, dpr: devicePixelRatio }), touch));
      await info.attach(`recherche-tactile-${touch}`, { body: await searchPage.screenshot(), contentType: 'image/png' });
      await search.fill('');
      await expect(main.locator('li')).toHaveCount(6);
    } finally { await context.close(); }
  }
  await info.attach('diagnostic-33', { body: JSON.stringify(observations, null, 2), contentType: 'application/json' });
});
