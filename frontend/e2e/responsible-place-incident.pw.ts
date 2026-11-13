import { expect, test } from '@playwright/test';

for (const space of ['agent', 'responsable']) {
  test(`Déclaration sur lieu ${space} : accès direct, filtres exclusifs, annulation et confirmation`, async ({ page }, info) => {
    const base = `/${space}/incidents`;
    const query = { q: '  introuvable  ', priority: 'low', status: 'closed' };
    await page.goto(`${base}?${new URLSearchParams(query)}`);
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalements');
    await expect(main).toBeFocused();
    await page.keyboard.press('Tab');
    const entry = main.getByRole('link', { name: 'Nouveau signalement', exact: true });
    await expect(entry).toBeFocused();
    await expect(entry).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Nouveau signalement');
    await expect(page).toHaveURL(url => url.pathname === `${base}/nouveau`);
    await main.getByLabel('Lieu (obligatoire)', { exact: true }).fill('Brouillon à abandonner');
    await main.getByRole('link', { name: 'Annuler', exact: true }).click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalements');
    expect(Object.fromEntries(new URL(page.url()).searchParams)).toEqual(query);
    await entry.click();
    await expect(main.getByLabel('Lieu (obligatoire)', { exact: true })).toHaveValue('');
    for (const place of ['', '   ']) {
      await main.getByLabel('Lieu (obligatoire)', { exact: true }).fill(place);
      await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
      await expect(main.getByLabel('Lieu (obligatoire)', { exact: true })).toBeFocused();
    }
    await main.getByLabel('Lieu (obligatoire)', { exact: true }).fill('Rue des Écoles, entrée sud');
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await expect(main.getByLabel('Intitulé', { exact: true })).toBeFocused();
    await main.getByLabel('Intitulé', { exact: true }).fill('Barrière à réparer');
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await expect(main.getByRole('radio', { name: /Basse/ })).toBeFocused();
    await main.getByRole('radio', { name: /Urgente/ }).check();
    await info.attach('formulaire-lieu', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await expect(main.locator('.review-values')).toContainText('Rue des Écoles, entrée sud');
    await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalement terminé');
    const view = main.getByRole('link', { name: 'Voir le signalement', exact: true });
    const createdPath = (await view.getAttribute('href'))!;
    expect(createdPath).toMatch(new RegExp(`^${base}/INC-LOCAL-[^?]+$`));
    await view.click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Barrière à réparer');
    await expect(main.locator('.place-summary')).toContainText('Rue des Écoles, entrée sud');
    await expect(main.locator('.metadata')).toContainText('Ouvert');
    await page.goBack();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Nouveau signalement');
    // Rejouer la confirmation pour vérifier explicitement son retour filtré.
    await main.getByLabel('Lieu (obligatoire)', { exact: true }).fill('Place de la mairie');
    await main.getByLabel('Intitulé', { exact: true }).fill('Second signalement');
    await main.getByRole('radio', { name: /Urgente/ }).check();
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
    const returns = main.getByRole('link', { name: 'Retour aux signalements', exact: true });
    await expect(returns).toHaveCount(2);
    for (const link of await returns.all()) {
      const target = new URL((await link.getAttribute('href'))!, page.url());
      expect(target.pathname).toBe(base);
      expect(Object.fromEntries(target.searchParams)).toEqual(query);
    }
    await main.locator('.return-link').click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalements');
    expect(Object.fromEntries(new URL(page.url()).searchParams)).toEqual(query);
    await expect(main.locator('tbody tr')).toHaveCount(0);
    await main.getByRole('button', { name: 'Réinitialiser les filtres', exact: true }).click();
    await expect(main.locator('tbody tr')).toHaveCount(8);
    await info.attach('liste-apres-creation', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.goto(`${base}/nouveau`);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Nouveau signalement');
    await expect(main.locator('form')).toBeVisible();
    await expect(main.locator('.equipment-summary')).toHaveCount(0);
  });
}
