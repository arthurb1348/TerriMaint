import { test, expect, type Locator } from '@playwright/test';

for (const space of ['agent', 'responsable']) {
  for (const domain of ['incidents', 'interventions']) {
    test(`Filtres alignés, aide et clavier — ${space}/${domain}`, async ({ page }, info) => {
      await page.goto(`/${space}/${domain}?q=introuvable&status=open`);
      const filters = page.getByRole('search');
      const search = filters.getByRole('searchbox');
      await expect(search).toHaveValue('introuvable');
      const helpId = await search.getAttribute('aria-describedby');
      expect(helpId).toBeTruthy();
      const help = page.locator(`#${helpId}`);
      await expect(help).toBeVisible();
      const controls = await filters.locator('input, select, button').all();
      const boxes = await Promise.all(
        controls.map(async (control) => (await control.boundingBox())!),
      );
      const helpBox = (await help.boundingBox())!;
      expect(helpBox.y).toBeGreaterThanOrEqual(boxes[0].y + boxes[0].height);
      if (info.project.use.viewport!.width === 1440 && space === 'responsable') {
        for (const box of boxes) expect(Math.abs(box.y - boxes[0].y)).toBeLessThan(1);
      }
      for (const [index, box] of boxes.entries()) {
        expect(box.width).toBeGreaterThan(0);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(info.project.use.viewport!.width);
        for (const other of boxes.slice(index + 1)) {
          expect(
            box.x + box.width <= other.x ||
              other.x + other.width <= box.x ||
              box.y + box.height <= other.y ||
              other.y + other.height <= box.y,
          ).toBe(true);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await search.focus();
      for (const control of controls.slice(1)) {
        await page.keyboard.press('Tab');
        await expect(control).toBeFocused();
        await expect(control).toHaveCSS('outline-style', 'solid');
      }
      await page.keyboard.press('Enter');
      await expect(search).toBeFocused();
      await expect(search).toHaveValue('');
      await expect(page).toHaveURL(`/${space}/${domain}`);
      await search.fill('tondeuse');
      await expect(page).toHaveURL((url) => url.searchParams.get('q') === 'tondeuse');
      const select = filters.getByRole('combobox').first();
      const option = domain === 'incidents' ? 'urgent' : 'planned';
      await select.selectOption(option);
      await expect(page).toHaveURL(
        (url) =>
          url.searchParams.get('q') === 'tondeuse' &&
          url.searchParams.get(domain === 'incidents' ? 'priority' : 'status') === option,
      );
      await info.attach('filtres', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });
  }
}

function contrast(first: string, second: string) {
  const luminance = (color: string) => {
    const values = color
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  const a = luminance(first),
    b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('Tuile urgente : contraste, clavier et passage 1 → 0 → 1 sans rechargement', async ({
  page,
}, info) => {
  await page.goto('/responsable');
  const main = page.getByRole('main');
  const urgent = main.locator('.indicators a').nth(1);
  const neutral = main.locator('.indicators a').first();
  const href = '/responsable/incidents?priority=urgent&status=not-closed';
  async function dashboard() {
    if (page.viewportSize()!.width <= 760)
      await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
    await page
      .getByRole('navigation', { name: 'Navigation Responsable', exact: true })
      .getByRole('link', { name: 'Tableau de bord', exact: true })
      .click();
    await expect(page).toHaveURL('/responsable');
  }
  async function colors(link: Locator) {
    return link.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        border: style.borderTopColor,
        text: style.color,
        focus: style.outlineColor,
        outline: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
        offset: parseFloat(style.outlineOffset),
      };
    });
  }
  async function state(count: number) {
    await expect(urgent.locator('.indicator-count')).toHaveText(String(count));
    await expect(urgent).toHaveAttribute('href', href);
    await page.mouse.move(0, 0);
    const baseline = await colors(neutral);
    const actual = await colors(urgent);
    if (count > 0) {
      expect(actual.background).toBe('rgb(255, 243, 224)');
      expect(actual.border).toBe('rgb(195, 130, 62)');
      await expect(main.locator('.indicators .urgent-indicator')).toHaveCount(1);
    } else {
      expect(actual.background).toBe(baseline.background);
      expect(actual.border).toBe(baseline.border);
      await expect(main.locator('.urgent-indicator')).toHaveCount(0);
    }
    for (const hover of [false, true]) {
      if (hover) await urgent.hover();
      await page.keyboard.press('ArrowRight');
      await urgent.focus();
      await expect(urgent).toBeFocused();
      const rendered = await colors(urgent);
      for (const text of await urgent.locator('span, strong').all()) {
        const color = await text.evaluate((element) => getComputedStyle(element).color);
        expect(contrast(color, rendered.background)).toBeGreaterThanOrEqual(4.5);
      }
      expect(rendered.outline).toBe('solid');
      expect(rendered.width).toBeGreaterThanOrEqual(3);
      expect(rendered.offset).toBeGreaterThanOrEqual(2);
      expect(contrast(rendered.focus, 'rgb(255, 255, 255)')).toBeGreaterThanOrEqual(3);
    }
    await info.attach(`urgence-${count}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  }
  await state(1);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(href);
  await expect(main.locator('tbody tr')).toHaveCount(1);
  await main.locator('tbody a').click();
  await main.getByRole('button', { name: 'Clôturer le signalement', exact: true }).click();
  await main
    .getByRole('group', { name: 'Confirmer la clôture', exact: true })
    .getByRole('button', { name: 'Clôturer le signalement', exact: true })
    .click();
  await expect(main.locator('.metadata')).toContainText('Clôturé');
  await dashboard();
  await state(0);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(href);
  await expect(main.locator('tbody tr')).toHaveCount(0);
  await dashboard();
  await main
    .getByRole('region', { name: 'Signalements à traiter', exact: true })
    .getByRole('link')
    .first()
    .click();
  await main.getByRole('link', { name: 'Voir le matériel', exact: true }).click();
  await main.getByRole('link', { name: 'Faire un signalement', exact: true }).click();
  await main.getByLabel('Intitulé', { exact: true }).fill('Nouvelle urgence');
  await main.getByRole('radio', { name: /Urgente/ }).check();
  await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
  await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
  await expect(main.getByRole('link', { name: 'Voir le signalement', exact: true })).toBeVisible();
  await dashboard();
  await state(1);
});
