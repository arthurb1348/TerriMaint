import { expect, test } from '@playwright/test';

test('Derniers signalements : deux créations du même jour, liens et clavier sans rechargement', async ({ page }, info) => {
  await page.clock.setFixedTime(new Date('2026-11-13T12:00:00Z'));
  await page.goto('/agent');
  const main = page.getByRole('main');
  const section = main.getByRole('region', { name: 'Derniers signalements', exact: true });
  const cards = section.locator('.recent-incident-link');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText('Bruit au freinage');
  await expect(cards.nth(1)).toContainText('Moteur qui cale');
  await expect(main.locator('.intervention-preview .preview-link')).toHaveCount(2);
  await expect(main.getByRole('link', { name: 'Scanner', exact: true })).toHaveCount(1);
  await cards.first().focus();
  for (const link of [cards.first(), cards.nth(1), section.getByRole('link', { name: 'Nouveau signalement', exact: true }), section.getByRole('link', { name: 'Voir tous les signalements', exact: true })]) {
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Tab');
  }
  await cards.first().focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/agent/incidents/INC-2026-046');
  await page.getByRole('navigation', { name: 'Navigation Agent', exact: true }).getByRole('link', { name: 'Accueil', exact: true }).click();
  for (const title of ['Premier signalement du jour', 'Second signalement du jour']) {
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Accueil');
    await section.getByRole('link', { name: 'Nouveau signalement', exact: true }).click();
    await expect(page).toHaveURL('/agent/incidents/nouveau');
    await main.getByLabel('Lieu (obligatoire)', { exact: true }).fill('Rue des Écoles');
    await main.getByLabel('Intitulé', { exact: true }).fill(title);
    await main.getByRole('radio', { name: /Urgente/ }).check();
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalement terminé');
    await page.getByRole('navigation', { name: 'Navigation Agent', exact: true }).getByRole('link', { name: 'Accueil', exact: true }).click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Accueil');
    await expect(cards.first()).toContainText(title);
    await expect(cards.first()).toContainText('Ouvert');
    await expect(cards).toHaveCount(2);
  }
  await expect(cards.nth(1)).toContainText('Premier signalement du jour');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await info.attach('accueil-deux-creations', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await section.getByRole('link', { name: 'Voir tous les signalements', exact: true }).click();
  await expect(page).toHaveURL('/agent/incidents');
  await expect(main.locator('tbody tr')).toHaveCount(8);
  await expect(main.locator('tbody tr').nth(6)).toContainText('Premier signalement du jour');
  await expect(main.locator('tbody tr').nth(7)).toContainText('Second signalement du jour');
});
