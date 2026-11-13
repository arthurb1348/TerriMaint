import { expect, test } from '@playwright/test';

for (const space of ['agent', 'responsable']) {
  test(`Confidentialité ${space} : pied de page, clavier et espace conservé`, async ({ page }, info) => {
    await page.goto(`/${space}/incidents`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Signalements');
    await expect(page.getByRole('main')).toBeFocused();
    const link = page.getByRole('contentinfo').getByRole('link', { name: 'Confidentialité', exact: true });
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press('Tab');
      if (await link.evaluate(el => el === document.activeElement)) break;
    }
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('End');
    await expect(link).toBeInViewport({ ratio: 1 });
    const usable = await link.evaluate(el => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    });
    expect(usable).toBe(true);
    await info.attach('pied-de-page', { body: await page.screenshot(), contentType: 'image/png' });
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(`/${space}/confidentialite`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Confidentialité');
    await expect(page.getByRole('main')).toBeFocused();
    await expect(page.locator('.shell')).toHaveClass(space === 'responsable' ? 'shell responsable' : 'shell');
    await expect(page.getByRole('main')).toContainText('révèlent la zone affichée');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await info.attach('confidentialite', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Signalements');
  });
}
