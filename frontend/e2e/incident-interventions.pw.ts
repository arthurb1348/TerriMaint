import { expect, test, type Page } from '@playwright/test';

async function openIncidents(page: Page, space: 'Agent' | 'Responsable') {
  await page.locator('.space-menu summary').click();
  await page.getByRole('link', { name: `Espace ${space}`, exact: true }).click();
  if (page.viewportSize()!.width <= 760) {
    const name = space === 'Agent' ? /^Plus/ : /^Ouvrir la navigation$/;
    await page.locator('app-main-navigation').getByRole('button', { name }).click();
  }
  await page.locator('nav').getByRole('link', { name: 'Signalements', exact: true }).click();
}

test('Les interventions liées restent consultables après terminaison puis clôture du signalement', async ({
  page,
}, info) => {
  const main = page.getByRole('main');
  const section = main.getByRole('region', { name: 'Interventions liées', exact: true });
  await page.goto('/responsable/incidents/INC-2026-048');
  const link = section.getByRole('link', { name: /Vérification du plateau de coupe/ });
  await expect(section.getByRole('link')).toHaveCount(1);
  await expect(link).toHaveAttribute('href', '/responsable/interventions/INT-2026-035');
  await expect(link.locator('.badge')).toHaveText('En cours');
  await page.keyboard.press('Tab');
  await link.focus();
  await expect(link).toBeFocused();
  await expect(link).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  await info.attach('interventions-liees', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await page.keyboard.press('Enter');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Vérification du plateau de coupe',
  );
  await openIncidents(page, 'Agent');
  await main.locator('tbody tr').filter({ hasText: 'INC-2026-048' }).getByRole('link').click();
  await expect(link).toHaveAttribute('href', '/agent/interventions/INT-2026-035');
  await link.click();
  await main.getByRole('button', { name: 'Intervention terminée', exact: true }).click();
  await expect(main.locator('.metadata .badge')).toHaveText('Terminée');
  await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
  await expect(link.locator('.badge')).toHaveText('Terminée');
  await openIncidents(page, 'Responsable');
  await main.locator('tbody tr').filter({ hasText: 'INC-2026-048' }).getByRole('link').click();
  await expect(link.locator('.badge')).toHaveText('Terminée');
  await main.getByRole('button', { name: 'Clôturer le signalement', exact: true }).click();
  const confirmation = main.getByRole('group', { name: 'Confirmer la clôture', exact: true });
  await expect(confirmation).not.toContainText('Au moins une intervention liée');
  await confirmation.getByRole('button', { name: 'Clôturer le signalement', exact: true }).click();
  await expect(main.locator('.metadata .badge')).toHaveText(['Haute', 'Clôturé']);
  await expect(section.getByRole('link')).toHaveCount(1);
  await expect(link.locator('.badge')).toHaveText('Terminée');
  await link.scrollIntoViewIfNeeded();
  await info.attach('historique-apres-cloture', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await link.click();
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Vérification du plateau de coupe',
  );
  await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
  await expect(main.locator('.metadata .badge')).toHaveText(['Haute', 'Clôturé']);
  await expect(link).toBeVisible();
});

test('Une nouvelle programmation rejoint la liste du signalement avec le filtre Agent', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-11-07T12:00:00Z'));
  const main = page.getByRole('main');
  const section = main.getByRole('region', { name: 'Interventions liées', exact: true });
  await page.goto('/responsable/incidents/INC-2026-045');
  await expect(section.getByRole('link')).toHaveCount(1);
  await main.getByRole('link', { name: 'Programmer une intervention', exact: true }).click();
  await main
    .getByLabel('Titre de l’intervention (obligatoire)', { exact: true })
    .fill('Suivi du moteur lié au signalement');
  await main
    .getByLabel('Agent à affecter (obligatoire)', { exact: true })
    .selectOption('AG-DEMO-002');
  await main.getByLabel('Date prévue (obligatoire)', { exact: true }).fill('2026-11-08');
  await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
  await main.getByRole('button', { name: 'Programmer l’intervention', exact: true }).click();
  await main.getByRole('link', { name: 'Voir l’intervention', exact: true }).click();
  await expect(page).toHaveURL(/\/responsable\/interventions\/INT-LOCAL-/);
  const interventionPath = new URL(page.url()).pathname;
  await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
  await expect(section.getByRole('link')).toHaveCount(2);
  const created = section.getByRole('link', { name: /Suivi du moteur lié au signalement/ });
  await expect(created).toHaveAttribute('href', interventionPath);
  await expect(created.locator('.badge')).toHaveText('Planifiée');
  await openIncidents(page, 'Agent');
  await main.locator('tbody tr').filter({ hasText: 'INC-2026-045' }).getByRole('link').click();
  await expect(section.getByRole('link')).toHaveCount(1);
  await expect(section).not.toContainText('Suivi du moteur lié au signalement');
  await expect(section.getByRole('link')).toHaveAttribute(
    'href',
    '/agent/interventions/INT-2026-032',
  );
  await main.getByRole('link', { name: 'Retour aux signalements', exact: true }).click();
  await main.locator('tbody tr').filter({ hasText: 'INC-2026-046' }).getByRole('link').click();
  await expect(section.getByRole('link')).toHaveCount(0);
  await expect(section).toContainText(
    'Aucune intervention ne vous est assignée pour ce signalement.',
  );
});

test('Un signalement sans intervention affiche un état vide adapté dans chaque espace', async ({
  page,
}, info) => {
  const main = page.getByRole('main');
  const section = main.getByRole('region', { name: 'Interventions liées', exact: true });
  await page.goto('/responsable/equipements/EQ-OUT-0001');
  await main.getByRole('link', { name: 'Faire un signalement', exact: true }).click();
  await main.getByLabel('Intitulé', { exact: true }).fill('Signalement sans intervention liée');
  await main.getByRole('radio', { name: 'Basse — intervention à planifier', exact: true }).check();
  await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
  await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
  await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
  await expect(section.getByRole('link')).toHaveCount(0);
  await expect(section).toContainText('Aucune intervention liée à ce signalement.');
  await expect(
    main.getByRole('link', { name: 'Programmer une intervention', exact: true }),
  ).toBeVisible();
  await openIncidents(page, 'Agent');
  await main
    .locator('tbody tr')
    .filter({ hasText: 'Signalement sans intervention liée' })
    .getByRole('link')
    .click();
  await expect(section.getByRole('link')).toHaveCount(0);
  await expect(section).toContainText(
    'Aucune intervention ne vous est assignée pour ce signalement.',
  );
  await section.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  await info.attach('etat-vide-agent', { body: await page.screenshot(), contentType: 'image/png' });
});
