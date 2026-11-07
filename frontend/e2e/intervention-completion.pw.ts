import { expect, test } from '@playwright/test';

test('Terminer une intervention partage le statut sans clore le signalement', async ({
  page,
}, info) => {
  await page.clock.setFixedTime(new Date('2026-11-07T12:00:00Z'));
  const requests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.url());
  });
  const main = page.getByRole('main');
  await page.goto('/agent/interventions');
  const row = main.locator('tbody tr').filter({ hasText: 'INT-2026-035' });
  await expect(row.locator('.badge')).toHaveText('En cours');
  await row.getByRole('link').click();
  await expect(page).toHaveURL('/agent/interventions/INT-2026-035');
  const complete = main.getByRole('button', { name: 'Intervention terminée', exact: true });
  await complete.focus();
  await expect(complete).toBeInViewport({ ratio: 1 });
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/agent/interventions/INT-2026-035');
  await expect(main.locator('.metadata .badge')).toHaveText('Terminée');
  await expect(complete).toHaveCount(0);
  const feedback = main.getByRole('status');
  await expect(feedback).toHaveText('L’intervention est maintenant terminée.');
  await expect(feedback).toBeFocused();
  await expect(feedback).toBeInViewport({ ratio: 1 });
  if (page.viewportSize()!.width <= 760) {
    const bounds = await feedback.boundingBox();
    const navigation = await page.locator('nav').boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(navigation!.y);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  await info.attach('confirmation-agent', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await main.getByRole('link', { name: 'Voir le matériel', exact: true }).click();
  await expect(page).toHaveURL('/agent/equipements/EQ-OUT-0001');
  const section = main.getByRole('region', { name: 'Interventions', exact: true });
  await expect(section.getByRole('link')).toHaveCount(1);
  await expect(section.locator('.badge')).toHaveText('Terminée');
  await expect(section).toContainText('Date prévue');
  await page.locator('nav').getByRole('link', { name: 'Interventions', exact: true }).click();
  await expect(row.locator('.badge')).toHaveText('Terminée');
  await main.getByLabel('Statut de l’intervention', { exact: true }).selectOption('completed');
  await expect(main.locator('tbody tr')).toHaveCount(1);
  await expect(main.locator('tbody')).toContainText('INT-2026-035');
  await page.locator('.space-menu summary').click();
  await page.getByRole('link', { name: 'Espace Agent', exact: true }).click();
  await expect(main.locator('.preview-list')).not.toContainText('Vérification du plateau de coupe');
  await page.locator('.space-menu summary').click();
  await page.getByRole('link', { name: 'Espace Responsable', exact: true }).click();
  if (page.viewportSize()!.width <= 760)
    await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
  await page.locator('nav').getByRole('link', { name: 'Interventions', exact: true }).click();
  await expect(row.locator('.badge')).toHaveText('Terminée');
  await row.getByRole('link').click();
  await expect(main.locator('.metadata .badge')).toHaveText('Terminée');
  await expect(complete).toHaveCount(0);
  await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
  await expect(page).toHaveURL('/responsable/incidents/INC-2026-048');
  await expect(main.locator('.metadata .badge')).toHaveText(['Haute', 'En cours']);
  await main.getByRole('link', { name: 'Programmer une intervention', exact: true }).click();
  await main
    .getByLabel('Titre de l’intervention (obligatoire)', { exact: true })
    .fill('Reprise du plateau de coupe');
  await main
    .getByLabel('Agent à affecter (obligatoire)', { exact: true })
    .selectOption('AG-DEMO-001');
  await main.getByLabel('Date prévue (obligatoire)', { exact: true }).fill('2026-11-08');
  await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
  await main.getByRole('button', { name: 'Programmer l’intervention', exact: true }).click();
  await main.getByRole('link', { name: 'Voir l’intervention', exact: true }).click();
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Reprise du plateau de coupe');
  await expect(main.locator('.metadata .badge')).toHaveText('Planifiée');
  await main.getByRole('link', { name: 'Voir le matériel', exact: true }).click();
  await expect(section.getByRole('link')).toHaveCount(2);
  await expect(
    section.getByRole('link', { name: /Vérification du plateau de coupe/ }).locator('.badge'),
  ).toHaveText('Terminée');
  await expect(
    section.getByRole('link', { name: /Reprise du plateau de coupe/ }).locator('.badge'),
  ).toHaveText('Planifiée');
  expect(requests).toEqual([]);
  expect(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
  ).toEqual({ local: 0, session: 0 });
  await page.reload();
  await expect(section.getByRole('link')).toHaveCount(1);
  await expect(section.locator('.badge')).toHaveText('En cours');
});

test('Les fiches non éligibles ne proposent pas le bouton de terminaison', async ({ page }) => {
  for (const path of [
    '/agent/interventions/INT-2026-032',
    '/agent/interventions/INT-2026-034',
    '/agent/interventions/INT-2026-036',
    '/agent/interventions/inconnue',
    '/responsable/interventions/INT-2026-035',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Intervention terminée', exact: true }),
    ).toHaveCount(0);
  }
});
