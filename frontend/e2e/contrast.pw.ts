import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

// Les couleurs sont lues dans le rendu, jamais recopiées depuis le nuancier.
function contrast(a: string, b: string): number {
  const luminance = (color: string) => {
    const channels = color.match(/[\d.]+/g)!.map(Number);
    expect(channels.length === 3 || channels[3] === 1, 'Couleur sRGB opaque').toBe(true);
    const linear = channels.slice(0, 3).map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const first = luminance(a), second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function measure(control: Locator, info: TestInfo, name: string, border = false, focus = false) {
  const actual = await control.evaluate((element) => {
    const background = (start: Element | null): string => {
      for (let node = start; node; node = node.parentElement) {
        const color = getComputedStyle(node).backgroundColor;
        if (color !== 'rgba(0, 0, 0, 0)') return color;
      }
      throw new Error('Fond opaque introuvable');
    };
    const style = getComputedStyle(element);
    return {
      text: style.color, inside: background(element), outside: background(element.parentElement),
      border: style.borderTopColor, borderWidth: parseFloat(style.borderTopWidth),
      outline: style.outlineColor, outlineStyle: style.outlineStyle,
      outlineWidth: parseFloat(style.outlineWidth), offset: parseFloat(style.outlineOffset),
    };
  });
  const ratios = {
    text: contrast(actual.text, actual.inside),
    borderInside: contrast(actual.border, actual.inside),
    borderOutside: contrast(actual.border, actual.outside),
    focus: contrast(actual.outline, actual.outside),
  };
  await info.attach(name, { body: JSON.stringify({ actual, ratios }, null, 2), contentType: 'application/json' });
  expect(ratios.text, `${name} : texte courant`).toBeGreaterThanOrEqual(4.5);
  if (border) {
    expect(actual.borderWidth).toBeGreaterThan(0);
    expect(ratios.borderInside).toBeGreaterThanOrEqual(3);
    expect(ratios.borderOutside).toBeGreaterThanOrEqual(3);
  }
  if (focus) {
    expect(actual.outlineStyle).toBe('solid');
    expect(actual.outlineWidth).toBeGreaterThanOrEqual(3);
    // Le décalage laisse le fond extérieur des deux côtés du contour.
    expect(actual.offset).toBeGreaterThanOrEqual(2);
    expect(ratios.focus, `${name} : focus / fond adjacent`).toBeGreaterThanOrEqual(3);
  }
}

async function focusControl(page: Page, control: Locator, info: TestInfo, name: string) {
  await page.keyboard.press('ArrowRight');
  await control.focus();
  await control.scrollIntoViewIfNeeded();
  await expect(control).toBeFocused();
  await measure(control, info, name, false, true);
  const visible = await control.evaluate((element) => {
    const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
    const extent = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
    if (rect.left - extent < 0 || rect.top - extent < 0 ||
        rect.right + extent > innerWidth || rect.bottom + extent > innerHeight) return false;
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const parentStyle = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
      if (/(hidden|clip|auto|scroll)/.test(parentStyle.overflowX) &&
          (rect.left - extent < bounds.left || rect.right + extent > bounds.right)) return false;
      if (/(hidden|clip|auto|scroll)/.test(parentStyle.overflowY) &&
          (rect.top - extent < bounds.top || rect.bottom + extent > bounds.bottom)) return false;
    }
    return [
      [rect.left + 1, rect.top + rect.height / 2],
      [rect.right - 1, rect.top + rect.height / 2],
      [rect.left + rect.width / 2, rect.top + 1],
      [rect.left + rect.width / 2, rect.bottom - 1],
    ].every(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return hit !== null && element.contains(hit);
    });
  });
  expect(visible, `${name} : contour dans la fenêtre, sans masque aux quatre côtés`).toBe(true);
}

async function states(page: Page, control: Locator, info: TestInfo, name: string, border = false) {
  await control.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await measure(control, info, `${name}-normal`, border);
  await control.hover();
  await measure(control, info, `${name}-survol`, border);
  await focusControl(page, control, info, `${name}-focus`);
  await measure(control, info, `${name}-focus-bordure`, border);
  await control.hover();
  await page.mouse.down();
  await measure(control, info, `${name}-actif`, border);
  await page.mouse.move(0, 0);
  await page.mouse.up();
}

async function capture(page: Page, info: TestInfo, name: string) {
  await info.attach(name, { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/health', (route) => route.fulfill({ json: { status: 'ok' } }));
});

for (const space of ['agent', 'responsable']) {
  test(`Contrastes rendus : cartes, champs et erreurs — ${space}`, async ({ page }, info) => {
    const main = page.getByRole('main');
    await page.goto(`/${space}/equipements`);
    await states(page, main.locator('input'), info, 'recherche-materiel', true);
    const card = main.locator('.business-card').first();
    await expect(card).toHaveCSS('border-top-color', 'rgb(213, 223, 217)');
    await measure(card.locator('.equipment-id'), info, 'texte-secondaire-carte');
    await focusControl(page, card.getByRole('link'), info, 'lien-carte');
    await capture(page, info, 'contraste-lien-carte');
    await page.goto(`/${space}/incidents/INC-2026-047`);
    for (const action of await main.locator('.page-action').all()) await states(page, action, info, 'action-fiche');
    await capture(page, info, 'contraste-actions');
    await page.goto(`/${space}/incidents/nouveau/EQ-OUT-0003`);
    for (const field of await main.locator('input[type=text], textarea').all()) {
      await expect(field).toHaveValue('');
      await states(page, field, info, 'declaration-champ-vide', true);
    }
    for (const action of await main.locator('.photo-actions button').all()) await states(page, action, info, 'photo-action');
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    const invalid = main.locator('#incident-title');
    await expect(invalid).toBeFocused();
    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
    const errorColor = await main.locator('#title-error').evaluate((element) => getComputedStyle(element).color);
    await expect(invalid).toHaveCSS('border-top-color', errorColor);
    await states(page, invalid, info, 'declaration-erreur', true);
    await measure(main.locator('#title-error'), info, 'message-erreur');
    await capture(page, info, 'contraste-declaration-erreur');
    for (const route of [`/${space}/incidents`, ...(space === 'responsable' ? ['/responsable/interventions'] : [])]) {
      await page.goto(route);
      for (const field of await main.locator('input, select').all()) await states(page, field, info, 'filtre', true);
      for (const badge of await main.locator('.badge').all()) await measure(badge, info, 'badge');
    }
    if (space === 'responsable') {
      await page.goto('/responsable/interventions/INT-2026-034');
      for (const action of await main.locator('.business-card .page-action').all()) await states(page, action, info, 'action-origine-carte');
      await page.goto('/responsable/interventions/nouvelle/INC-2026-047');
      for (const field of await main.locator('input, select, textarea').all()) await states(page, field, info, 'programmation-champ', true);
      await main.locator('#planning-title').fill('');
      await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
      for (const field of await main.locator('[aria-invalid=true]').all()) await states(page, field, info, 'programmation-erreur', true);
      await capture(page, info, 'contraste-programmation-erreur');
    }
  });

  test(`Contrastes rendus : shell, menus et navigation — ${space}`, async ({ page }, info) => {
    await page.goto(`/${space}/equipements`);
    await page.keyboard.press('Tab');
    await page.getByRole('main').focus();
    await measure(page.getByRole('main'), info, 'shell-fond-page', false, true);
    const summary = page.locator('summary');
    await states(page, summary, info, 'menu-espaces');
    await summary.press('Enter');
    await states(page, page.locator('.space-links a').first(), info, 'lien-menu-espaces');
    await summary.press('Enter');
    if (space === 'responsable' && page.viewportSize()!.width <= 760) {
      const toggle = page.getByRole('button', { name: 'Ouvrir la navigation', exact: true });
      await states(page, toggle, info, 'menu-responsable');
      await toggle.click();
    }
    for (const link of await page.locator('nav a:visible').all()) {
      await states(page, link, info, 'navigation');
      if (space === 'responsable') await expect(link).toHaveCSS('outline-color', 'rgb(255, 255, 255)');
    }
    if (space === 'agent' && page.viewportSize()!.width <= 760) {
      const plus = page.getByRole('button', { name: /^Plus/ });
      await states(page, plus, info, 'plus');
      await plus.click();
      await states(page, page.getByRole('button', { name: 'Fermer' }), info, 'fermer-plus', true);
      await focusControl(page, page.locator('.secondary-links a').first(), info, 'lien-plus');
    }
    await capture(page, info, 'contraste-navigation');
  });
}

test('Contrastes rendus : bouton de santé', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('API disponible');
  await states(page, page.getByRole('button', { name: /Vérifier à nouveau/ }), info, 'sante');
});

test('Contrastes rendus : Scanner, saisie et erreur', async ({ page }, info) => {
  await page.goto('/agent/scanner');
  const main = page.getByRole('main');
  const input = main.getByLabel('Référence du matériel', { exact: true });
  await states(page, input, info, 'scanner-reference', true);
  for (const action of await main.locator('.page-action').all()) await states(page, action, info, 'scanner-action');
  await measure(main.getByRole('status'), info, 'scanner-message');
  await measure(main.locator('.privacy'), info, 'scanner-confidentialite');
  await input.fill('EQ-OUT-9999'); await input.press('Enter');
  await expect(input).toBeFocused();
  await states(page, input, info, 'scanner-reference-erreur', true);
  await measure(main.getByRole('alert'), info, 'scanner-erreur', true);
  await capture(page, info, 'scanner-contrastes');
});

test('Contrastes rendus : aperçu et consultation des interventions Agent', async ({ page }, info) => {
  const main = page.getByRole('main');
  await page.goto('/agent');
  const scannerCard = main.getByRole('link', { name: 'Scanner un matériel', exact: true });
  if (page.viewportSize()!.width < 1200) await states(page, scannerCard, info, 'carte-scanner');
  else await expect(scannerCard).toBeHidden();
  const preview = main.locator('.preview-link').first();
  await states(page, preview, info, 'apercu-agent');
  await measure(preview.locator('.reference'), info, 'reference-apercu');
  await measure(preview.locator('.badge'), info, 'statut-apercu');
  await page.goto('/agent/interventions');
  for (const field of await main.locator('input, select').all()) await states(page, field, info, 'filtre-agent', true);
  await focusControl(page, main.locator('tbody a').first(), info, 'lien-intervention-agent');
  for (const badge of await main.locator('.badge').all()) await measure(badge, info, 'statut-agent');
  await page.goto('/agent/interventions/INT-2026-032');
  await focusControl(page, main.locator('.back-link'), info, 'retour-agent');
  await measure(main.locator('.badge'), info, 'statut-detail-agent');
  await capture(page, info, 'contraste-detail-agent');
});
