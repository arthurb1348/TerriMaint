import { expect, test } from '@playwright/test';

test('Clôturer après avoir terminé l’intervention conserve les statuts et bloque la programmation', async ({
  page,
}, info) => {
  const main = page.getByRole('main');
  await page.goto('/responsable/incidents/INC-2026-048');
  const close = main.getByRole('button', { name: 'Clôturer le signalement', exact: true });
  const confirmation = main.getByRole('group', { name: 'Confirmer la clôture', exact: true });
  await close.click();
  const cancel = confirmation.getByRole('button', { name: 'Annuler', exact: true });
  await expect(cancel).toBeFocused();
  await expect(confirmation).toContainText(
    'Au moins une intervention liée est encore planifiée ou en cours',
  );
  await info.attach('avertissement-avant-annulation', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await cancel.click();
  await expect(confirmation).toHaveCount(0);
  await expect(close).toBeFocused();
  await expect(main.locator('.metadata .badge')).toHaveText(['Haute', 'En cours']);
  await page.locator('.space-menu summary').click();
  await page.getByRole('link', { name: 'Espace Agent', exact: true }).click();
  await page.locator('nav').getByRole('link', { name: 'Interventions', exact: true }).click();
  await main.locator('tbody tr').filter({ hasText: 'INT-2026-035' }).getByRole('link').click();
  await expect(main.locator('.metadata .badge')).toHaveText('En cours');
  await main.getByRole('button', { name: 'Intervention terminée', exact: true }).click();
  await expect(main.locator('.metadata .badge')).toHaveText('Terminée');
  await page.locator('.space-menu summary').click();
  await page.getByRole('link', { name: 'Espace Responsable', exact: true }).click();
  if (page.viewportSize()!.width <= 760)
    await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
  await page.locator('nav').getByRole('link', { name: 'Incidents', exact: true }).click();
  await main.locator('tbody tr').filter({ hasText: 'INC-2026-048' }).getByRole('link').click();
  await expect(main.locator('.metadata .badge')).toHaveText(['Haute', 'En cours']);
  // Conserver une entrée de formulaire dans l’historique pour tester son accès après clôture.
  await main.getByRole('link', { name: 'Programmer une intervention', exact: true }).click();
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Programmer une intervention');
  await main.getByRole('link', { name: 'Retour au signalement', exact: true }).click();
  await close.click();
  await expect(confirmation).not.toContainText('Au moins une intervention liée');
  await confirmation.getByRole('button', { name: 'Clôturer le signalement', exact: true }).click();
  await expect(page).toHaveURL('/responsable/incidents/INC-2026-048');
  await expect(main.locator('.metadata .badge')).toHaveText(['Haute', 'Clôturé']);
  const feedback = main.getByRole('status');
  await expect(feedback).toHaveText('Le signalement est maintenant clôturé.');
  await expect(feedback).toBeFocused();
  await expect(feedback).toBeInViewport({ ratio: 1 });
  await expect(close).toHaveCount(0);
  await expect(
    main.getByRole('link', { name: 'Programmer une intervention', exact: true }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  await info.attach('signalement-cloture', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await page.goBack();
  await expect(page).toHaveURL('/responsable/interventions/nouvelle/INC-2026-048');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalement clôturé');
  await expect(main.locator('form')).toHaveCount(0);
  await expect(
    main.getByRole('button', { name: 'Programmer l’intervention', exact: true }),
  ).toHaveCount(0);
  await main.getByRole('link', { name: 'Retour au signalement', exact: true }).click();
  await main.getByRole('link', { name: 'Retour aux signalements', exact: true }).click();
  const row = main.locator('tbody tr').filter({ hasText: 'INC-2026-048' });
  await expect(row.locator('.badge').last()).toHaveText('Clôturé');
  await main.getByLabel('Statut du signalement', { exact: true }).selectOption('closed');
  await expect(main.locator('tbody tr')).toHaveCount(3);
  await row.getByRole('link').click();
  await main.getByRole('link', { name: 'Voir le matériel', exact: true }).click();
  await expect(
    main.getByRole('region', { name: 'Interventions', exact: true }).locator('.badge'),
  ).toHaveText('Terminée');
  await page.locator('.space-menu summary').click();
  await page.getByRole('link', { name: 'Espace Agent', exact: true }).click();
  if (page.viewportSize()!.width <= 760)
    await page.locator('nav').getByRole('button', { name: /^Plus/ }).click();
  await page.locator('nav').getByRole('link', { name: 'Incidents', exact: true }).click();
  await main.locator('tbody tr').filter({ hasText: 'INC-2026-048' }).getByRole('link').click();
  await expect(main.locator('.metadata .badge')).toHaveText(['Haute', 'Clôturé']);
  await expect(close).toHaveCount(0);
});

test('Clôturer malgré une intervention active ne termine pas celle-ci', async ({ page }) => {
  const main = page.getByRole('main');
  await page.goto('/responsable/incidents/INC-2026-048');
  await main.getByRole('button', { name: 'Clôturer le signalement', exact: true }).click();
  const confirmation = main.getByRole('group', { name: 'Confirmer la clôture', exact: true });
  await expect(confirmation).toContainText(
    'Au moins une intervention liée est encore planifiée ou en cours',
  );
  const confirm = confirmation.getByRole('button', {
    name: 'Clôturer le signalement',
    exact: true,
  });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(main.locator('.metadata .badge')).toHaveText(['Haute', 'Clôturé']);
  await main.getByRole('link', { name: 'Voir le matériel', exact: true }).click();
  const section = main.getByRole('region', { name: 'Interventions', exact: true });
  await expect(section.locator('.badge')).toHaveText('En cours');
  await section.getByRole('link').click();
  await expect(main.locator('.metadata .badge')).toHaveText('En cours');
  await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
  await expect(main.locator('.metadata .badge')).toHaveText(['Haute', 'Clôturé']);
});

test('Les fiches sans action de clôture restent consultables et Échap annule une confirmation', async ({
  page,
}) => {
  const main = page.getByRole('main');
  for (const path of [
    '/agent/incidents/INC-2026-048',
    '/responsable/incidents/INC-2026-049',
    '/responsable/incidents/absent',
  ]) {
    await page.goto(path);
    await expect(main.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      main.getByRole('button', { name: 'Clôturer le signalement', exact: true }),
    ).toHaveCount(0);
  }
  await page.goto('/responsable/incidents/INC-2026-045');
  const close = main.getByRole('button', { name: 'Clôturer le signalement', exact: true });
  await close.click();
  const confirmation = main.getByRole('group', { name: 'Confirmer la clôture', exact: true });
  await expect(confirmation).toContainText(
    'Au moins une intervention liée est encore planifiée ou en cours',
  );
  await page.keyboard.press('Escape');
  await expect(confirmation).toHaveCount(0);
  await expect(close).toBeFocused();
  await expect(main.locator('.metadata .badge')).toHaveText(['Basse', 'Ouvert']);
});
