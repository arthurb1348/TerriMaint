import { expect, test, type Page } from '@playwright/test';

async function fits(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/health', (route) => route.fulfill({ json: { status: 'ok' } }));
});

test('Mes interventions : aperçu, URL, filtres, détail et retour au clavier', async ({
  page,
}, info) => {
  const main = page.getByRole('main');
  await page.goto('/agent');
  await expect(main).toContainText('Pour Camille Durand');
  await expect(main.locator('.preview-link .reference')).toHaveText([
    'INT-2026-035',
    'INT-2026-032',
  ]);
  await expect(main.locator('.preview-link time')).toHaveText(['30/10/2026', '03/11/2026']);
  await fits(page);
  await info.attach('apercu-agent', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  const access = page.getByRole('navigation', { name: 'Navigation Agent' }).getByRole('link', { name: 'Interventions', exact: true });
  await access.focus();
  await expect(access).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Mes interventions');
  await expect(main).toBeFocused();
  await expect(main.locator('tbody tr')).toHaveCount(2);
  await expect(main.getByRole('combobox', { name: 'Agent affecté', exact: true })).toHaveCount(0);
  await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', '/agent/interventions');
  await main.getByRole('searchbox').fill('Tondeuse');
  await main.getByLabel('Statut de l’intervention', { exact: true }).selectOption('in-progress');
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get('q') === 'Tondeuse' && url.searchParams.get('status') === 'in-progress',
  );
  await page.reload();
  await expect(main.getByRole('searchbox')).toHaveValue('Tondeuse');
  await expect(main.locator('tbody tr')).toHaveCount(1);
  const rowLink = main.locator('tbody a');
  await expect(rowLink).toHaveAttribute(
    'href',
    '/agent/interventions/INT-2026-035?q=Tondeuse&status=in-progress',
  );
  await fits(page);
  await info.attach('liste-agent', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  await rowLink.focus();
  await page.keyboard.press('Enter');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Vérification du plateau de coupe',
  );
  await expect(main).toContainText('Non renseignées');
  await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', '/agent/interventions');
  await expect(main.getByRole('link', { name: 'Voir le matériel', exact: true })).toHaveAttribute(
    'href',
    '/agent/equipements/EQ-OUT-0001',
  );
  await expect(
    main.getByRole('link', { name: 'Voir le signalement', exact: true }),
  ).toHaveAttribute('href', '/agent/incidents/INC-2026-048');
  await expect(main.locator('form')).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Intervention terminée', exact: true })).toBeVisible();
  await fits(page);
  await info.attach('detail-agent', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  await main.getByRole('link', { name: 'Retour à mes interventions', exact: true }).click();
  await expect(main.getByRole('searchbox')).toHaveValue('Tondeuse');
  await expect(main.getByLabel('Statut de l’intervention', { exact: true })).toHaveValue(
    'in-progress',
  );
  await main.getByLabel('Statut de l’intervention', { exact: true }).selectOption('completed');
  await expect(main).toContainText('Aucune intervention ne correspond');
  await main.getByRole('button', { name: 'Réinitialiser les filtres', exact: true }).click();
  await expect(main.getByRole('searchbox')).toBeFocused();
  await expect(main.locator('tbody tr')).toHaveCount(2);
  await fits(page);
});

test('Les URL Agent ignorent assignee et distinguent une affectation étrangère et un id inconnu', async ({
  page,
}) => {
  const main = page.getByRole('main');
  await page.goto('/agent/interventions?assignee=AG-DEMO-002');
  await expect(main.locator('tbody tr')).toHaveCount(2);
  await expect(main.locator('tbody')).not.toContainText('INT-2026-034');
  await expect(main.locator('tbody a').first()).not.toHaveAttribute('href', /assignee/);
  await page.goto('/agent/interventions/INT-2026-033?q=OUT&status=planned&assignee=AG-DEMO-003');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Intervention non assignée');
  await expect(main).not.toContainText('Contrôle du système de freinage');
  await expect(main.locator('.origin, .metadata, .instructions')).toHaveCount(0);
  await expect(main.locator('a')).toHaveCount(1);
  await expect(main.locator('a')).toHaveAttribute(
    'href',
    '/agent/interventions?q=OUT&status=planned',
  );
  await fits(page);
  await page.goto('/agent/interventions/inconnue?status=planned');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Intervention introuvable');
  await main.getByRole('link', { name: 'Retour à mes interventions', exact: true }).click();
  await expect(main.locator('tbody tr')).toHaveCount(1);
  await expect(main.getByLabel('Statut de l’intervention', { exact: true })).toHaveValue('planned');
  await fits(page);
});

test('Les créations Responsable apparaissent seulement pour leur agent, sans recharger l’onglet', async ({
  page,
}, info) => {
  await page.clock.setFixedTime(new Date('2026-11-06T12:00:00Z'));
  const main = page.getByRole('main');
  const switchSpace = async (name: string) => {
    await page.locator('.space-menu > summary').click();
    await page.getByRole('link', { name: `Espace ${name}`, exact: true }).click();
    await expect(page).toHaveURL(`/${name.toLowerCase()}`);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(
      name === 'Agent' ? 'Accueil' : 'Tableau de bord',
    );
  };
  await page.goto('/responsable/incidents/INC-2026-045');
  for (const [agent, title] of [
    ['AG-DEMO-001', 'Mission Camille créée'],
    ['AG-DEMO-002', 'Mission Alex créée'],
  ]) {
    await main.getByRole('link', { name: 'Programmer une intervention', exact: true }).click();
    await main.getByLabel('Titre de l’intervention (obligatoire)', { exact: true }).fill(title);
    await main.getByLabel('Agent à affecter (obligatoire)', { exact: true }).selectOption(agent);
    await main.getByLabel('Date prévue (obligatoire)', { exact: true }).fill('2026-11-07');
    await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
    await main.getByRole('button', { name: 'Programmer l’intervention', exact: true }).click();
    await main.getByRole('link', { name: 'Voir l’intervention', exact: true }).click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(title);
    await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(
      'Moteur qui cale à l’accélération',
    );
  }
  await switchSpace('Agent');
  await expect(main.locator('.preview-link')).toHaveCount(3);
  await expect(main.locator('.preview-link').last()).toContainText('Mission Camille créée');
  await expect(main).not.toContainText('Mission Alex créée');
  await main.getByRole('link', { name: 'Voir toutes mes interventions', exact: true }).click();
  await expect(main.locator('tbody tr')).toHaveCount(3);
  await main.getByRole('searchbox').fill('Mission');
  await expect(main.locator('tbody tr')).toHaveCount(1);
  await main.locator('tbody a').click();
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Mission Camille créée');
  await expect(main.locator('.origin')).toContainText('EQ-OUT-0003');
  await fits(page);
  await info.attach('creation-responsable-vers-agent', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  await switchSpace('Responsable');
  await main.getByRole('link', { name: 'Interventions', exact: true }).click();
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Interventions');
  await expect(main.locator('tbody tr')).toHaveCount(8);
  await main.getByRole('searchbox').fill('Mission');
  await expect(main.locator('tbody tr')).toHaveCount(2);
  await fits(page);
});
