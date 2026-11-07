import { test, expect, type Page } from '@playwright/test';

async function navigate(page: Page, name: string) {
  const nav = page.getByRole('navigation', { name: 'Navigation Responsable', exact: true });
  if (page.viewportSize()!.width <= 760)
    await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
  await nav.getByRole('link', { name, exact: true }).click();
}
async function dashboard(page: Page) {
  await navigate(page, 'Tableau de bord');
  await expect(page).toHaveURL((url) => url.pathname === '/responsable');
  const mobile = page.viewportSize()!.width <= 760;
  if (mobile) await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
  await expect(
    page
      .getByRole('navigation', { name: 'Navigation Responsable', exact: true })
      .getByRole('link', { name: 'Tableau de bord', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  if (mobile) await page.getByRole('button', { name: 'Fermer la navigation', exact: true }).click();
}
const labels = [
  'Signalements ouverts',
  'Signalements urgents non clôturés',
  'Interventions planifiées',
];
async function counts(page: Page, values: number[]) {
  for (const [index, label] of labels.entries())
    await expect(
      page
        .locator('.indicators')
        .getByRole('link', { name: new RegExp(`^${label} `) })
        .locator('.indicator-count'),
    ).toHaveText(String(values[index]));
}

test('Chaque indicateur ouvre sa liste exacte et conserve ses filtres au retour', async ({
  page,
}, info) => {
  await page.goto('/responsable');
  await counts(page, [2, 1, 2]);
  const scenarios = [
    { label: labels[0], path: '/responsable/incidents', query: 'status=open', count: 2 },
    {
      label: labels[1],
      path: '/responsable/incidents',
      query: 'priority=urgent&status=not-closed',
      count: 1,
    },
    { label: labels[2], path: '/responsable/interventions', query: 'status=planned', count: 2 },
  ];
  for (const item of scenarios) {
    const link = page
      .locator('.indicators')
      .getByRole('link', { name: new RegExp(`^${item.label} `) });
    await expect(link).toHaveAttribute('href', `${item.path}?${item.query}`);
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      (url) => url.pathname === item.path && url.search === `?${item.query}`,
    );
    const main = page.getByRole('main');
    await expect(main.locator('tbody tr')).toHaveCount(item.count);
    await main.locator('tbody a').first().click();
    const back = main.locator('.back-link');
    await expect(back).toHaveAttribute('href', `${item.path}?${item.query}`);
    await back.click();
    await expect(main.locator('tbody tr')).toHaveCount(item.count);
    if (item.query.includes('not-closed'))
      await expect(main.getByLabel('Statut du signalement', { exact: true })).toHaveValue(
        'not-closed',
      );
    await dashboard(page);
  }
  const incidents = page.getByRole('region', { name: 'Signalements à traiter', exact: true });
  await expect(incidents.locator('.reference')).toHaveText([
    'INC-2026-046',
    'INC-2026-047',
    'INC-2026-048',
  ]);
  const interventions = page.getByRole('region', { name: 'Interventions planifiées', exact: true });
  await expect(interventions.locator('.reference')).toHaveText(['INT-2026-033', 'INT-2026-032']);
  await expect(page.locator('.dashboard-link a, .dashboard-link button')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await info.attach('tableau-de-bord', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});

test('Déclarer urgent, programmer puis clôturer actualise les compteurs dans le même onglet', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-11-07T12:00:00Z'));
  await page.goto('/responsable');
  await counts(page, [2, 1, 2]);
  await navigate(page, 'Matériel');
  const main = page.getByRole('main');
  await main.getByRole('link', { name: 'Tondeuse autoportée', exact: true }).click();
  await main.getByRole('link', { name: 'Faire un signalement', exact: true }).click();
  await main.getByLabel('Intitulé', { exact: true }).fill('Urgence du tableau de bord');
  await main.getByRole('radio', { name: /Urgente/ }).check();
  await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
  await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
  await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
  await expect(page).toHaveURL(/\/incidents\/INC-LOCAL-/);
  await dashboard(page);
  await counts(page, [3, 2, 2]);
  await expect(
    main
      .getByRole('region', { name: 'Signalements à traiter', exact: true })
      .getByRole('link')
      .first(),
  ).toContainText('Urgence du tableau de bord');
  await main
    .locator('.indicators')
    .getByRole('link', { name: /^Signalements urgents/ })
    .click();
  await expect(page).toHaveURL((url) => url.pathname === '/responsable/incidents' && url.searchParams.get('priority') === 'urgent' && url.searchParams.get('status') === 'not-closed');
  await expect(main.locator('tbody tr')).toHaveCount(2);
  await main.getByRole('link', { name: /Urgence du tableau de bord/ }).click();
  await main.getByRole('link', { name: 'Programmer une intervention', exact: true }).click();
  await main
    .getByLabel('Titre de l’intervention (obligatoire)', { exact: true })
    .fill('Intervention du tableau de bord');
  await main
    .getByLabel('Agent à affecter (obligatoire)', { exact: true })
    .selectOption('AG-DEMO-001');
  await main.getByLabel('Date prévue (obligatoire)', { exact: true }).fill('2026-11-08');
  await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
  await main.getByRole('button', { name: 'Programmer l’intervention', exact: true }).click();
  await expect(
    main.getByRole('link', { name: 'Retour au signalement', exact: true }),
  ).toHaveAttribute('href', /priority=urgent&status=not-closed$/);
  await dashboard(page);
  await counts(page, [3, 2, 3]);
  await main
    .locator('.indicators')
    .getByRole('link', { name: /^Interventions planifiées/ })
    .click();
  await expect(main.locator('tbody tr')).toHaveCount(3);
  await expect(main.getByRole('link', { name: /Intervention du tableau de bord/ })).toBeVisible();
  await dashboard(page);
  await main
    .locator('.indicators')
    .getByRole('link', { name: /^Signalements urgents/ })
    .click();
  await expect(page).toHaveURL((url) => url.pathname === '/responsable/incidents' && url.searchParams.get('priority') === 'urgent' && url.searchParams.get('status') === 'not-closed');
  await expect(main.locator('tbody tr')).toHaveCount(2);
  await main.getByRole('link', { name: /Urgence du tableau de bord/ }).click();
  await main.getByRole('button', { name: 'Clôturer le signalement', exact: true }).click();
  await main
    .getByRole('group', { name: 'Confirmer la clôture', exact: true })
    .getByRole('button', { name: 'Clôturer le signalement', exact: true })
    .click();
  await expect(main.locator('.metadata')).toContainText('Clôturé');
  await dashboard(page);
  await counts(page, [2, 1, 3]);
  await expect(
    main.getByRole('region', { name: 'Signalements à traiter', exact: true }),
  ).not.toContainText('Urgence du tableau de bord');
});
