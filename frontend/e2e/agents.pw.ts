import { expect, test, type Page } from '@playwright/test';

async function agents(page: Page) {
  await page.locator('.space-menu summary').click();
  await page.getByRole('link', { name: 'Espace Responsable', exact: true }).click();
  await expect(page).toHaveURL('/responsable');
  if (page.viewportSize()!.width <= 760)
    await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navigation Responsable', exact: true }).getByRole('link', { name: 'Agents', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Agents');
}

test('Agents : zéros, filtre complet, programmation et terminaison sans rechargement', async ({ page }, info) => {
  await page.goto('/responsable/agents');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Agents');
  const cards = main.locator('.agents-list > li');
  await expect(cards).toHaveCount(3);
  await expect(main).toBeFocused();
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Tab');
    const link = cards.nth(i).getByRole('link');
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS('outline-style', 'solid');
  }
  await expect(cards.nth(0).locator('dd')).toHaveText(['1', '1']);
  await expect(cards.nth(1).locator('dd')).toHaveText(['0', '1']);
  await expect(cards.nth(2).locator('dd')).toHaveText(['1', '0']);
  await expect(page.locator('nav a[aria-current="page"]').filter({ hasText: 'Agents' })).toHaveCount(1);
  for (let i = 0; i < 3; i++) {
    await cards.nth(i).getByRole('link').click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Interventions');
    await expect(main.getByLabel('Agent affecté', { exact: true })).toHaveValue(`AG-DEMO-00${i + 1}`);
    await expect(main.locator('tbody tr')).toHaveCount(2);
    await expect(main.locator('tbody .badge')).toHaveText(i === 0 ? ['Planifiée', 'En cours'] : i === 1 ? ['En cours', 'Terminée'] : ['Planifiée', 'Terminée']);
    await agents(page);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await info.attach('agents', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await page.evaluate(() => { history.pushState(null, '', '/responsable/interventions/materiel/EQ-OUT-0001'); dispatchEvent(new PopStateEvent('popstate')); });
  await main.getByLabel('Titre de l’intervention (obligatoire)', { exact: true }).fill('Entretien pour Alex');
  await main.getByLabel('Agent à affecter (obligatoire)', { exact: true }).selectOption('AG-DEMO-002');
  await main.getByLabel('Date prévue (obligatoire)', { exact: true }).fill('2099-11-20');
  await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
  await main.getByRole('button', { name: 'Programmer l’intervention', exact: true }).click();
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Programmation terminée');
  await agents(page);
  await expect(cards.nth(1).locator('dd')).toHaveText(['1', '1']);
  await cards.nth(1).getByRole('link').click();
  await expect(main.locator('tbody tr')).toHaveCount(3);
  await page.locator('.space-menu summary').click();
  await page.getByRole('link', { name: 'Espace Agent', exact: true }).click();
  await expect(page).toHaveURL('/agent');
  await page.getByRole('navigation', { name: 'Navigation Agent', exact: true }).getByRole('link', { name: 'Interventions', exact: true }).click();
  await main.getByRole('link', { name: /Vérification du plateau de coupe/ }).click();
  await main.getByRole('button', { name: 'Intervention terminée', exact: true }).click();
  await expect(main.locator('.metadata')).toContainText('Terminée');
  await agents(page);
  await expect(cards.nth(0).locator('dd')).toHaveText(['1', '0']);
  await cards.nth(0).getByRole('link').click();
  await expect(main.locator('tbody .badge')).toHaveText(['Planifiée', 'Terminée']);
});
