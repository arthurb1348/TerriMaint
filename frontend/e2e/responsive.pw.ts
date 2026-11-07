import { expect, test as base, type Locator, type Page, type TestInfo } from '@playwright/test';

const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // Ces tests isolent l'interface : ils ne prouvent pas l'intégration avec Django.
    await page.route('**/api/v1/health', (route) => route.fulfill({ json: { status: 'ok' } }));
    await use(page);
    expect(errors, 'Aucune erreur JavaScript pendant le parcours').toEqual([]);
  },
});

const routes = [
  '/',
  '/agent',
  '/agent/equipements',
  '/agent/equipements/EQ-OUT-0003',
  '/agent/equipements/inconnu',
  '/agent/incidents',
  '/agent/incidents/INC-2026-047',
  '/agent/incidents/inconnu',
  '/agent/incidents/nouveau/EQ-OUT-0003',
  '/agent/incidents/nouveau/inconnu',
  '/agent/scanner',
  '/responsable/scanner',
  '/agent/profil',
  '/responsable',
  '/responsable/equipements',
  '/responsable/equipements/EQ-OUT-0003',
  '/responsable/equipements/inconnu',
  '/responsable/incidents',
  '/responsable/incidents/INC-2026-047',
  '/responsable/incidents/inconnu',
  '/responsable/incidents/nouveau/EQ-OUT-0003',
  '/responsable/incidents/nouveau/inconnu',
  '/responsable/interventions',
  '/responsable/interventions/INT-2026-034',
  '/responsable/interventions/inconnu',
  '/responsable/interventions/nouvelle/INC-2026-047',
  '/responsable/interventions/nouvelle/INC-2026-049',
  '/responsable/interventions/nouvelle/inconnu',
  '/responsable/agents',
];

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  // Un pixel de tolérance absorbe les arrondis de mise en page, pas un élément tronqué.
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) -
            document.documentElement.clientWidth,
        ),
      { message: 'Le document tient dans la largeur de la fenêtre' },
    )
    .toBeLessThanOrEqual(1);
}

async function capture(page: Page, info: TestInfo, name: string): Promise<void> {
  await info.attach(name, {
    body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
    contentType: 'image/png',
  });
}

async function expectSingleLineLabel(control: Locator): Promise<void> {
  await expect(control).toBeInViewport({ ratio: 1 });
  const fits = await control.evaluate((element) => {
    const label = element.querySelector('span:last-child');
    if (!label) return false;
    const range = document.createRange();
    range.selectNodeContents(label);
    const text = range.getBoundingClientRect();
    const bounds = element.getBoundingClientRect();
    const lines = new Set(Array.from(range.getClientRects(), (rect) => Math.round(rect.top)));
    return lines.size === 1 && text.left >= bounds.left - 1 && text.right <= bounds.right + 1;
  });
  expect(fits, 'Le libellé tient sur une ligne dans son bouton').toBe(true);
}

async function expectFocusedControlVisible(
  page: Page,
  control: Locator,
  space: string,
): Promise<void> {
  await expect(control).toBeFocused();
  await expect(control).toBeInViewport({ ratio: 1 });
  if (space === 'agent') {
    await expect
      .poll(
        async () => {
          const bounds = (await control.boundingBox())!;
          const navigation = (await page.locator('nav').boundingBox())!;
          return bounds.y + bounds.height <= navigation.y;
        },
        { message: 'Le contrôle focalisé reste au-dessus de la navigation fixe' },
      )
      .toBe(true);
  }
}

async function expectIncidentsActive(page: Page, space: string): Promise<void> {
  await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute(
    'href',
    `/${space}/incidents`,
  );
  if (space === 'agent' && page.viewportSize()!.width <= 760) {
    const plus = page.getByRole('button', { name: 'Plus — Incidents actif', exact: true });
    await expect(plus).toBeVisible();
    await expect(plus).toHaveClass(/active/);
  }
}

async function expectEvenAgentNavigation(navigation: Locator): Promise<void> {
  const links = await navigation.getByRole('link').evaluateAll((elements) =>
    elements.map((element) => {
      const { left, right, width } = element.getBoundingClientRect();
      return { left, right, width };
    }),
  );
  const content = await navigation.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      left: bounds.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
      right: bounds.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight),
    };
  });
  expect(links.length).toBeGreaterThan(0);
  expect(links[0].left).toBeCloseTo(content.left, 0);
  expect(links[links.length - 1].right).toBeCloseTo(content.right, 0);
  for (let index = 1; index < links.length; index++) {
    expect(links[index].width).toBeCloseTo(links[0].width, 0);
    expect(links[index].left).toBeCloseTo(links[index - 1].right, 0);
  }
}

for (const path of routes) {
  test(`La page ${path} tient dans la fenêtre`, async ({ page }, info) => {
    await page.goto(path);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
    if (path === '/') await expect(page.getByRole('status')).toContainText('API disponible');
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'page');
  });
}

for (const space of ['agent', 'responsable']) {
  test.describe(`Consultation des signalements — ${space}`, () => {
    test.use({ timezoneId: 'Europe/Paris' });
    test(`La consultation des signalements de ${space} conserve recherche et filtres au clavier`, async ({
      page,
    }, info) => {
      const base = `/${space}/incidents`;
      const query = '  EQ-OUT  ';
      const main = page.getByRole('main');
      const rows = main.locator('tbody tr');
      const search = main.getByRole('searchbox', {
        name: 'Rechercher un signalement',
        exact: true,
      });
      const priority = main.getByRole('combobox', { name: 'Priorité', exact: true });
      const status = main.getByRole('combobox', { name: 'Statut du signalement', exact: true });
      const reset = main.getByRole('button', { name: 'Réinitialiser les filtres', exact: true });
      await page.goto(base);
      await expect(page.locator('.screen-title')).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Incidents');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(rows).toHaveCount(6);
      await expect(rows.first().locator('time')).toHaveText('28/10/2026');
      await expect(main.getByText('Données de démonstration', { exact: true })).toHaveCount(0);
      await expect(main.getByRole('status')).toHaveText('6 signalements trouvés.');
      await expect(main.getByRole('table').getByRole('columnheader')).toHaveCount(5);
      const expectedDisplay =
        space === 'responsable' && page.viewportSize()!.width === 1440 ? 'table' : 'block';
      expect(
        await main.locator('table').evaluate((element) => getComputedStyle(element).display),
      ).toBe(expectedDisplay);
      await expectIncidentsActive(page, space);
      await expectNoHorizontalOverflow(page);
      await capture(page, info, 'signalements-liste');
      const longTitle = rows.getByRole('link', { name: /INC-2026-047/ });
      await longTitle.focus();
      await expectFocusedControlVisible(page, longTitle, space);
      await capture(page, info, 'signalement-intitule-long-focus');
      await main.focus();
      const historyLength = await page.evaluate(() => history.length);
      await expect(main).toBeFocused();
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, search, space);
      await page.keyboard.type(query);
      await expect(rows).toHaveCount(4);
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, priority, space);
      await priority.selectOption('high');
      await expect(rows).toHaveCount(1);
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, status, space);
      await status.selectOption('in-progress');
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === base &&
          url.searchParams.get('q') === query &&
          url.searchParams.get('priority') === 'high' &&
          url.searchParams.get('status') === 'in-progress',
      );
      expect(
        await page.evaluate(() => history.length),
        'La saisie et les filtres ne créent pas une entrée par changement',
      ).toBe(historyLength);
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, reset, space);
      await page.keyboard.press('Tab');
      const open = rows.getByRole('link', { name: /INC-2026-048.*Vibration du plateau de coupe/ });
      await expectFocusedControlVisible(page, open, space);
      await capture(page, info, 'signalements-filtres');
      await page.keyboard.press('Enter');
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(
        'Vibration du plateau de coupe',
      );
      await expect(main.locator('.description')).toHaveText('Non renseignée');
      await expect(main.locator('.equipment-summary')).toContainText('Tondeuse autoportée');
      await expectIncidentsActive(page, space);
      await expect(main).toBeFocused();
      await expectNoHorizontalOverflow(page);
      await capture(page, info, 'signalement-detail');
      await page.keyboard.press('Tab');
      const back = main.getByRole('link', { name: 'Retour aux signalements', exact: true });
      await expectFocusedControlVisible(page, back, space);
      await page.keyboard.press('Enter');
      await expect(search).toHaveValue(query);
      await expect(priority).toHaveValue('high');
      await expect(status).toHaveValue('in-progress');
      await expect(rows).toHaveCount(1);
      await page.reload();
      await expect(search).toHaveValue(query);
      await expect(priority).toHaveValue('high');
      await expect(status).toHaveValue('in-progress');
      await expect(rows).toHaveCount(1);
      await open.click();
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(
        'Vibration du plateau de coupe',
      );
      await expect(main).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(back).toBeFocused();
      await page.keyboard.press('Tab');
      const material = main.getByRole('link', { name: 'Voir le matériel', exact: true });
      await expectFocusedControlVisible(page, material, space);
      await expect(material).toHaveAttribute('href', `/${space}/equipements/EQ-OUT-0001`);
      await page.keyboard.press('Enter');
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Tondeuse autoportée');
      await expect(page).toHaveURL(
        (url) => url.pathname === `/${space}/equipements/EQ-OUT-0001` && url.search === '',
      );
      await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute(
        'href',
        `/${space}/equipements`,
      );
      await page.goBack();
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(
        'Vibration du plateau de coupe',
      );
      await back.click();
      await expect(search).toHaveValue(query);
      await status.selectOption('closed');
      await expect(rows).toHaveCount(0);
      await expect(main.getByRole('status')).toHaveText('0 signalement trouvé.');
      await expect(main).toContainText('Aucun signalement ne correspond');
      await expectNoHorizontalOverflow(page);
      await capture(page, info, 'signalements-aucun-resultat');
      await reset.focus();
      await page.keyboard.press('Enter');
      await expectFocusedControlVisible(page, search, space);
      await expect(rows).toHaveCount(6);
      await expect(page).toHaveURL((url) => url.pathname === base && url.search === '');
      await search.fill('x'.repeat(350));
      await expect(rows).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await reset.click();
      await expect(rows).toHaveCount(6);
      await expect(search).toBeFocused();
    });

    test(`Le détail des signalements de ${space} gère accès direct, rechargement, risque et inconnu`, async ({
      page,
    }, info) => {
      const base = `/${space}/incidents`;
      const main = page.getByRole('main');
      await page.goto(`${base}/INC-2026-047?q=chauffage&priority=high&status=in-progress`);
      await expect(main.getByRole('heading', { level: 1 })).toContainText(
        'Température irrégulière',
      );
      await expect(main.locator('.description')).toContainText('Le panneau de commande');
      await expect(main.locator('.equipment-summary')).toContainText('École des Marronniers');
      await expectIncidentsActive(page, space);
      await expectNoHorizontalOverflow(page);
      await capture(page, info, 'signalement-detail-long');
      await page.reload();
      await expect(main.getByRole('heading', { level: 1 })).toContainText(
        'Température irrégulière',
      );
      await expect(main.locator('time')).toHaveText('27/10/2026');
      await expect(
        main.getByRole('link', { name: 'Retour aux signalements', exact: true }),
      ).toHaveAttribute('href', `${base}?q=chauffage&priority=high&status=in-progress`);
      await page.goto(`${base}/INC-2026-046`);
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(
        'Bruit au freinage du fourgon de voirie',
      );
      await expect(main.locator('.risk-note')).toContainText('ne change pas le statut du matériel');
      await expectNoHorizontalOverflow(page);
      const query = '  tONDEUSE  ';
      await page.goto(
        `${base}/inconnu?${new URLSearchParams({ q: query, priority: 'incorrect', status: 'incorrect' })}`,
      );
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalement introuvable');
      await expect(main.getByRole('link', { name: 'Voir le matériel', exact: true })).toHaveCount(
        0,
      );
      await expectIncidentsActive(page, space);
      await expectNoHorizontalOverflow(page);
      await capture(page, info, 'signalement-introuvable');
      await main.getByRole('link', { name: 'Retour aux signalements', exact: true }).click();
      await expect(main.getByRole('searchbox')).toHaveValue(query);
      await expect(main.getByRole('combobox', { name: 'Priorité', exact: true })).toHaveValue('');
      await expect(
        main.getByRole('combobox', { name: 'Statut du signalement', exact: true }),
      ).toHaveValue('');
      await expect(main.locator('tbody tr')).toHaveCount(1);
      await expect(main.locator('tbody')).toContainText('INC-2026-048');
      await expectNoHorizontalOverflow(page);
    });
  });

  test(`La déclaration de ${space} valide au clavier, permet de modifier et termine sans enregistrement`, async ({
    page,
  }, info) => {
    const query = '  tONDeUSE  ';
    const material = `/${space}/equipements`;
    const detail = `${material}/EQ-OUT-0001`;
    const declaration = `/${space}/incidents/nouveau/EQ-OUT-0001`;
    const main = page.getByRole('main');
    const title = main.getByRole('textbox', { name: 'Intitulé', exact: true });
    const description = main.getByRole('textbox', {
      name: 'Description (facultative)',
      exact: true,
    });
    const verify = main.getByRole('button', { name: 'Vérifier le signalement', exact: true });
    const risk = main.getByRole('checkbox', {
      name: "Je signale un risque ou une impossibilité d'utilisation",
      exact: true,
    });
    const businessRequests: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/')) businessRequests.push(request.url());
    });
    await page.goto(`${detail}?${new URLSearchParams({ q: query })}`);
    await expect(main).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(main.getByRole('link', { name: 'Retour au matériel', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    const open = main.getByRole('link', { name: 'Déclarer un incident', exact: true });
    await expectFocusedControlVisible(page, open, space);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      (url) => url.pathname === declaration && url.searchParams.get('q') === query,
    );
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Déclarer un incident');
    await expect(main.getByText('Données de démonstration', { exact: true })).toHaveCount(0);
    await expect(main.locator('.demo-notice')).toHaveCount(0);
    await expect(main.locator('.equipment-summary')).toContainText('Tondeuse autoportée');
    await expect(main.locator('.equipment-summary')).toContainText(
      'EQ-OUT-0001 · Centre technique municipal',
    );
    await expectIncidentsActive(page, space);
    await expect(main).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      main.getByRole('link', { name: 'Retour à la fiche matériel', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expectFocusedControlVisible(page, title, space);
    await page.keyboard.type('   ');
    await page.keyboard.press('Tab');
    await expectFocusedControlVisible(page, description, space);
    await page.keyboard.type('Le moteur cale lors de l’accélération.\nRedémarrage difficile.');
    await verify.focus();
    await page.keyboard.press('Enter');
    await expectFocusedControlVisible(page, title, space);
    await expect(title).toHaveAttribute('aria-invalid', 'true');
    await expect(title).toHaveAttribute('aria-describedby', 'title-help title-error');
    await expect(main.locator('#title-error')).toContainText('caractère autre');
    await expect(title).toHaveValue('   ');
    await expect(description).toHaveValue(
      'Le moteur cale lors de l’accélération.\nRedémarrage difficile.',
    );
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'incident-erreurs');
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('Le moteur cale');
    await verify.focus();
    await page.keyboard.press('Enter');
    const low = main.getByRole('radio', { name: 'Basse — intervention à planifier', exact: true });
    await expectFocusedControlVisible(page, low, space);
    await expect(main.locator('#priority-error')).toContainText('Choisissez une priorité');
    await expect(main.getByRole('radio', { checked: true })).toHaveCount(0);
    await page.keyboard.press('ArrowDown');
    const high = main.getByRole('radio', { name: 'Haute — intervention rapide', exact: true });
    await expect(high).toBeChecked();
    await expectFocusedControlVisible(page, high, space);
    await page.keyboard.press('Tab');
    await expectFocusedControlVisible(page, risk, space);
    await page.keyboard.press('Space');
    await expect(risk).toBeChecked();
    await page.keyboard.press('Tab');
    await expectFocusedControlVisible(page, verify, space);
    await capture(page, info, 'incident-formulaire');
    await page.keyboard.press('Enter');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Vérifier le signalement');
    await expect(main.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(main.locator('dd')).toHaveText([
      'Le moteur cale',
      'Le moteur cale lors de l’accélération.\nRedémarrage difficile.',
      'Haute — intervention rapide',
      'Oui',
    ]);
    await expectIncidentsActive(page, space);
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'incident-recapitulatif');
    await page.keyboard.press('Tab');
    await expect(
      main.getByRole('button', { name: 'Envoyer le signalement', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    const edit = main.getByRole('button', { name: 'Modifier le signalement', exact: true });
    await expectFocusedControlVisible(page, edit, space);
    await page.keyboard.press('Enter');
    await expectFocusedControlVisible(page, title, space);
    await expect(description).toHaveValue(
      'Le moteur cale lors de l’accélération.\nRedémarrage difficile.',
    );
    await expect(high).toBeChecked();
    await expect(risk).toBeChecked();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('Le moteur cale à chaud');
    await verify.focus();
    await page.keyboard.press('Enter');
    await expect(main.locator('dd').first()).toHaveText('Le moteur cale à chaud');
    await page.keyboard.press('Tab');
    const finish = main.getByRole('button', { name: 'Envoyer le signalement', exact: true });
    await expectFocusedControlVisible(page, finish, space);
    await expect(main.getByRole('button', { name: 'Envoyer le signalement', exact: true })).toBeInViewport({ ratio: 1 });
    await expect(finish).toHaveAccessibleDescription('');
    await page.keyboard.press('Enter');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalement terminé');
    await expect(main.locator('.return-link')).toHaveAttribute('href', /\/equipements\/EQ-/);
    await expectIncidentsActive(page, space);
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'incident-simulation-terminee');
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === declaration &&
        url.searchParams.get('q') === query &&
        [...url.searchParams.keys()].join() === 'q',
    );
    expect(businessRequests, 'Aucune requête métier pour cette simulation').toEqual([]);
    expect(
      await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })),
    ).toEqual({ local: {}, session: {} });
    await page.keyboard.press('Tab');
    const created = main.getByRole('link', { name: 'Voir le signalement', exact: true });
    await expectFocusedControlVisible(page, created, space);
    await page.keyboard.press('Tab');
    const back = main.getByRole('link', { name: 'Retour à la fiche', exact: true });
    await expectFocusedControlVisible(page, back, space);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      (url) => url.pathname === detail && url.searchParams.get('q') === query,
    );
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', material);
    await main.getByRole('link', { name: 'Retour au matériel', exact: true }).click();
    await expect(main.getByRole('searchbox')).toHaveValue(query);
    await expect(main.getByRole('listitem')).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
  });

  test(`Le signalement de ${space} accepte une description vide ou blanche et conserve la saisie après modification`, async ({
    page,
  }, info) => {
    const query = '  OUT  ';
    const main = page.getByRole('main');
    await page.goto(`/${space}/incidents/nouveau/EQ-OUT-0003?${new URLSearchParams({ q: query })}`);
    const title = main.getByRole('textbox', { name: 'Intitulé', exact: true });
    const description = main.getByRole('textbox', {
      name: 'Description (facultative)',
      exact: true,
    });
    const verify = main.getByRole('button', { name: 'Vérifier le signalement', exact: true });
    const edit = main.getByRole('button', { name: 'Modifier le signalement', exact: true });
    await expect(description).not.toHaveAttribute('required');
    await title.fill('Bruit au démarrage');
    await main
      .getByRole('radio', { name: 'Basse — intervention à planifier', exact: true })
      .check();
    for (const value of ['', '   ']) {
      await description.fill(value);
      await verify.focus();
      await page.keyboard.press('Enter');
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Vérifier le signalement');
      await expect(main.getByRole('heading', { level: 1 })).toBeFocused();
      await expect(main.locator('dd').nth(1)).toHaveText('Non renseignée');
      await expectIncidentsActive(page, space);
      await expectNoHorizontalOverflow(page);
      await page.keyboard.press('Tab');
      await expect(
        main.getByRole('button', { name: 'Envoyer le signalement', exact: true }),
      ).toBeFocused();
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, edit, space);
      await page.keyboard.press('Enter');
      await expectFocusedControlVisible(page, title, space);
      await expect(title).toHaveValue('Bruit au démarrage');
      await expect(description).toHaveValue(value);
      await expect(
        main.getByRole('radio', { name: 'Basse — intervention à planifier', exact: true }),
      ).toBeChecked();
      await expect(main.locator('.error')).toHaveCount(0);
    }
    await verify.focus();
    await page.keyboard.press('Enter');
    // Attendre le focus posé après rendu avant de reprendre la tabulation.
    await expect(main.getByRole('heading', { level: 1 })).toBeFocused();
    await page.keyboard.press('Tab');
    const send = main.getByRole('button', { name: 'Envoyer le signalement', exact: true });
    await expectFocusedControlVisible(page, send, space);
    await expect(main.getByRole('button', { name: 'Envoyer le signalement', exact: true })).toBeInViewport({ ratio: 1 });
    await capture(page, info, 'signalement-sans-description');
    await page.keyboard.press('Enter');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalement terminé');
    await expect(main.locator('.return-link')).toHaveAttribute('href', /\/equipements\/EQ-/);
    await main.getByRole('link', { name: 'Retour à la fiche', exact: true }).click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `/${space}/equipements/EQ-OUT-0003` && url.searchParams.get('q') === query,
    );
  });

  test(`La déclaration de ${space} fonctionne en accès direct, s'annule et perd sa saisie au rechargement`, async ({
    page,
  }, info) => {
    const path = `/${space}/incidents/nouveau/EQ-OUT-0003`;
    const query = '  OUT  ';
    const main = page.getByRole('main');
    await page.goto(`${path}?${new URLSearchParams({ q: query })}`);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Déclarer un incident');
    await expectIncidentsActive(page, space);
    const title = main.getByRole('textbox', { name: 'Intitulé', exact: true });
    const description = main.getByRole('textbox', {
      name: 'Description (facultative)',
      exact: true,
    });
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await expectFocusedControlVisible(page, title, space);
    await expect(main.locator('.error')).toHaveCount(2);
    await title.fill('B'.repeat(120));
    await description.fill('D'.repeat(2000));
    await main.getByRole('radio', { name: 'Urgente — danger immédiat', exact: true }).check();
    await main.getByRole('checkbox').check();
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Vérifier le signalement');
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'incident-recapitulatif-limites');
    await page.reload();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Déclarer un incident');
    await expect(title).toHaveValue('');
    await expect(description).toHaveValue('');
    await expect(main.getByRole('radio', { checked: true })).toHaveCount(0);
    await expect(main.getByRole('checkbox')).not.toBeChecked();
    await expect(main.locator('.error')).toHaveCount(0);
    await main.getByRole('link', { name: 'Annuler', exact: true }).click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `/${space}/equipements/EQ-OUT-0003` && url.searchParams.get('q') === query,
    );
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Débroussailleuse n°3');
    await main.getByRole('link', { name: 'Déclarer un incident', exact: true }).click();
    await expect(title).toHaveValue('');
    await main.getByRole('link', { name: 'Retour à la fiche matériel', exact: true }).click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `/${space}/equipements/EQ-OUT-0003` && url.searchParams.get('q') === query,
    );
    await page.goto(`/${space}/incidents/nouveau/inconnu?${new URLSearchParams({ q: query })}`);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Équipement introuvable');
    await expect(main.locator('form')).toHaveCount(0);
    await expectIncidentsActive(page, space);
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'incident-materiel-introuvable');
    await main.getByRole('link', { name: 'Retour au matériel', exact: true }).click();
    await expect(main.getByRole('searchbox')).toHaveValue(query);
    await expect(main.getByRole('listitem')).toHaveCount(4);
  });

  test(`La recherche Matériel fonctionne au clavier dans l’espace ${space}`, async ({
    page,
  }, info) => {
    await page.goto(`/${space}/equipements`);
    const main = page.getByRole('main');
    const input = main.getByRole('searchbox', { name: 'Rechercher par nom ou identifiant' });
    const items = main.getByRole('list', { name: 'Équipements' }).getByRole('listitem');
    const clear = main.getByRole('button', { name: 'Effacer la recherche' });

    await expect(main.getByText('Données de démonstration', { exact: true })).toHaveCount(0);
    await expect(items).toHaveCount(6);
    await input.focus();
    await page.keyboard.type('  tONDeUSE  ');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Tondeuse autoportée');
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'recherche-nom');

    await input.fill('  eq-veh-0042  ');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Fourgon de voirie');
    await input.fill('   ');
    await expect(items).toHaveCount(6);

    await input.fill('Équipement introuvable '.repeat(15));
    await expect(items).toHaveCount(0);
    await expect(main.getByRole('status')).toContainText('Aucun équipement ne correspond');
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'recherche-sans-resultat');
    await page.keyboard.press('Tab');
    await expect(clear).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('');
    await expect(items).toHaveCount(6);
    await expect(page).toHaveURL(new RegExp(`/${space}/equipements$`));
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute(
      'href',
      `/${space}/equipements`,
    );
    await expectNoHorizontalOverflow(page);
  });

  test(`La fiche Matériel conserve la recherche et le clavier dans l’espace ${space}`, async ({
    page,
  }, info) => {
    const base = `/${space}/equipements`;
    const query = '  tONDeUSE  ';
    await page.goto(base);
    const main = page.getByRole('main');
    const input = main.getByRole('searchbox', { name: 'Rechercher par nom ou identifiant' });
    await input.focus();
    await page.keyboard.type(query);
    await expect(main.getByRole('listitem')).toHaveCount(1);
    await expect(page).toHaveURL(
      (url) => url.pathname === base && url.searchParams.get('q') === query,
    );
    const equipment = main.getByRole('link', { name: 'Tondeuse autoportée', exact: true });
    // L'URL peut précéder le rendu du href : attendre aussi la destination exacte du lien.
    await expect
      .poll(async () => {
        const href = await equipment.getAttribute('href');
        if (!href) return null;
        const detailUrl = new URL(href, page.url());
        return { path: detailUrl.pathname, q: detailUrl.searchParams.get('q') };
      })
      .toEqual({ path: `${base}/EQ-OUT-0001`, q: query });

    await page.keyboard.press('Tab');
    await expect(main.getByRole('button', { name: 'Effacer la recherche' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(equipment).toBeFocused();
    await expect(equipment).toBeInViewport({ ratio: 1 });
    if (space === 'agent') {
      const linkBounds = (await equipment.boundingBox())!;
      const navigationBounds = (await page.locator('nav').boundingBox())!;
      expect(
        linkBounds.y + linkBounds.height,
        'Le lien focalisé reste au-dessus de la barre basse',
      ).toBeLessThanOrEqual(navigationBounds.y);
    }
    await capture(page, info, 'lien-fiche-focus');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      (url) => url.pathname === `${base}/EQ-OUT-0001` && url.searchParams.get('q') === query,
    );
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Tondeuse autoportée');
    await expect(main.getByText('Données de démonstration', { exact: true })).toHaveCount(0);
    await expect(main.getByText('EQ-OUT-0001', { exact: true })).toBeVisible();
    await expect(main.getByText('Centre technique municipal', { exact: true })).toBeVisible();
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', base);
    await expect(page.locator('nav')).toHaveAttribute(
      'aria-label',
      space === 'agent' ? 'Navigation Agent' : 'Navigation Responsable',
    );
    await expect(main).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'fiche-materiel');

    await page.keyboard.press('Tab');
    await expect(main.getByRole('link', { name: 'Retour au matériel', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      (url) => url.pathname === base && url.searchParams.get('q') === query,
    );
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Matériel');
    await expect(input).toHaveValue(query);
    await expect(main.getByRole('listitem')).toHaveCount(1);
    await expect(equipment).toBeVisible();
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', base);
    await expect(main).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'retour-recherche');
  });

  test(`La fiche Matériel de ${space} fonctionne en accès direct, après rechargement et avec un id inconnu`, async ({
    page,
  }, info) => {
    const base = `/${space}/equipements`;
    const main = page.getByRole('main');
    await page.goto(`${base}/EQ-OUT-0003`);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Débroussailleuse n°3');
    await expect(main.getByText('Atelier municipal', { exact: true })).toBeVisible();
    const back = main.getByRole('link', { name: 'Retour au matériel', exact: true });
    await expect(back).toHaveAttribute('href', base);
    await page.reload();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Débroussailleuse n°3');
    await expect(main.getByText('EQ-OUT-0003', { exact: true })).toBeVisible();
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', base);
    await expectNoHorizontalOverflow(page);
    await back.click();
    await expect(page).toHaveURL(new RegExp(`${base}$`));
    await expect(main.getByRole('listitem')).toHaveCount(6);

    await page.goto(`${base}/EQ-VEH-0042`);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Fourgon de voirie');
    await expect(main).not.toContainText('Débroussailleuse');
    await expect(main.getByText('Garage municipal', { exact: true })).toBeVisible();

    const query = '  eq-veh-0042  ';
    await page.goto(`${base}/inconnu?${new URLSearchParams({ q: query })}`);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Équipement introuvable');
    await expect(main).not.toContainText('Fourgon de voirie');
    await expect(main.getByText('Données de démonstration', { exact: true })).toHaveCount(0);
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', base);
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'equipement-introuvable');
    await back.click();
    await expect(page).toHaveURL(
      (url) => url.pathname === base && url.searchParams.get('q') === query,
    );
    const input = main.getByRole('searchbox', { name: 'Rechercher par nom ou identifiant' });
    await expect(input).toHaveValue(query);
    await expect(main.getByRole('listitem')).toHaveCount(1);
    await expect(main.getByRole('link', { name: 'Fourgon de voirie', exact: true })).toBeVisible();
    await page.reload();
    await expect(input).toHaveValue(query);
    await expect(main.getByRole('listitem')).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
  });
}

test('La navigation Agent conserve ses destinations selon la taille', async ({ page }, info) => {
  await page.goto('/agent');
  const navigation = page.getByRole('navigation', { name: 'Navigation Agent' });
  // Le shell remplace son lien d’accueil initial après la première navigation Angular.
  await expect(navigation.getByRole('link', { name: 'Accueil', exact: true })).toHaveAttribute('href', '/agent');
  const plus = navigation.getByRole('button', { name: /^Plus/ });
  const incidents = navigation.getByRole('link', { name: 'Incidents', exact: true });
  const profile = navigation.getByRole('link', { name: 'Profil', exact: true });

  if ((page.viewportSize()?.width ?? 0) > 760) {
    await expect(plus).toBeHidden();
    const names = ['Accueil', 'Matériel', 'Interventions', ...(page.viewportSize()!.width < 1200 ? ['Scanner'] : []), 'Incidents', 'Profil'];
    await expect(navigation.getByRole('link')).toHaveText(names);
    await expect(incidents).toBeVisible();
    await expect(profile).toBeVisible();
    await expectEvenAgentNavigation(navigation);
    await expectNoHorizontalOverflow(page);
    return;
  }

  await expect(incidents).toBeHidden();
  await expect(profile).toBeHidden();
  for (const name of ['Accueil', 'Matériel', 'Interventions']) {
    await expectSingleLineLabel(navigation.getByRole('link', { name, exact: true }));
  }
  await expectSingleLineLabel(plus);

  // Le toucher reproduit le blur qui avait masqué les liens avant leur activation.
  await plus.tap();
  await expect(plus).toHaveAttribute('aria-expanded', 'true');
  await expect(incidents).toBeInViewport({ ratio: 1 });
  await expect(profile).toBeInViewport({ ratio: 1 });
  await expectNoHorizontalOverflow(page);
  await capture(page, info, 'menu-plus-ouvert');

  await page.keyboard.press('Escape');
  await expect(plus).toHaveAttribute('aria-expanded', 'false');
  await expect(plus).toBeFocused();

  await plus.tap();
  await incidents.tap();
  await expect(page).toHaveURL(/\/agent\/incidents$/);
  await expect(plus).toHaveAccessibleName('Plus — Incidents actif');
  await expect(plus).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('main')).toBeFocused();

  await plus.tap();
  await profile.tap();
  await expect(page).toHaveURL(/\/agent\/profil$/);
  await expect(plus).toHaveAccessibleName('Plus — Profil actif');

  await plus.tap();
  await navigation.getByRole('button', { name: 'Fermer', exact: true }).tap();
  await expect(plus).toHaveAttribute('aria-expanded', 'false');
  await expect(plus).toBeFocused();

  await plus.tap();
  await page.getByRole('main').getByRole('heading', { level: 1 }).tap();
  await expect(plus).toHaveAttribute('aria-expanded', 'false');
  await expectNoHorizontalOverflow(page);
});

test('La carte Scanner suit la présentation et la route reste accessible', async ({ page }, info) => {
  await page.goto('/agent');
  const main = page.getByRole('main');
  const card = main.getByRole('link', { name: 'Scanner', exact: true });
  const navigation = page.getByRole('navigation', { name: 'Navigation Agent' });
  const scannerVisible = page.viewportSize()!.width < 1200;
  await expect(card).toBeVisible({ visible: scannerVisible });
  await expect(navigation.locator('a[href="/agent/scanner"]')).toHaveCount(1);
  await expect(main.locator('.page-shortcuts')).toHaveCount(0);
  await expect(main.getByRole('link', { name: /^(Matériel|Incidents|Mes interventions)$/ })).toHaveCount(0);
  await expect(main.locator('.preview-link')).toHaveCount(2);
  await capture(page, info, 'carte-scanner-accueil');
  await main.focus();
  await page.keyboard.press('Tab');
  if (scannerVisible) {
    await expect(card).toBeFocused();
    await expectFocusedControlVisible(page, card, 'agent');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/agent\/scanner$/);
  } else {
    await expect(main.locator('.preview-link').first()).toBeFocused();
    await expect(main.locator('a[href="/agent/scanner"]')).not.toBeFocused();
  }
  await page.goto('/agent/scanner');
  await expect(page).toHaveURL(/\/agent\/scanner$/);
  await expect(main.getByRole('heading', { name: 'Scanner', exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Démarrer la caméra', exact: true })).toBeVisible();
  await expect(main.getByLabel('Référence du matériel', { exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Ouvrir la fiche matériel', exact: true })).toBeVisible();
  await navigation.getByRole('link', { name: 'Accueil', exact: true }).focus();
  await page.keyboard.press('Tab');
  const equipment = navigation.getByRole('link', { name: 'Matériel', exact: true });
  await expect(equipment).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(navigation.getByRole('link', { name: 'Interventions', exact: true })).toBeFocused();
  await equipment.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/agent\/equipements$/);
  await expect(main.getByRole('searchbox', { name: 'Rechercher par nom ou identifiant' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('Redimensionner conserve la carte Scanner sous 1200 px et répartit la navigation', async ({ page }, info) => {
  await page.goto('/agent');
  const main = page.getByRole('main');
  const navigation = page.getByRole('navigation', { name: 'Navigation Agent' });
  const card = main.getByRole('link', { name: 'Scanner', exact: true });
  for (const width of [1024, 1199, 1200, 1201, 1440, 1200, 1199, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1024 });
    await expect(card).toBeVisible({ visible: width < 1200 });
    await expect(navigation.locator('a[href="/agent/scanner"]')).toHaveCount(1);
    await expect(navigation.getByRole('link', { name: 'Interventions', exact: true })).toBeVisible();
    if (width > 760) {
      await expect(navigation.getByRole('link')).toHaveText(['Accueil', 'Matériel', 'Interventions', ...(width < 1200 ? ['Scanner'] : []), 'Incidents', 'Profil']);
      await expectEvenAgentNavigation(navigation);
    } else {
      await expect(navigation.getByRole('link')).toHaveText(['Accueil', 'Matériel', 'Interventions']);
      await expect(navigation.getByRole('button', { name: 'Plus', exact: true })).toBeVisible();
      await expectSingleLineLabel(navigation.getByRole('link', { name: 'Interventions', exact: true }));
    }
    await expectNoHorizontalOverflow(page);
    if ([1024, 1199, 1200, 1201].includes(width)) await capture(page, info, `seuil-${width}`);
  }
});

test('La navigation Responsable garde le contexte après un changement de page', async ({
  page,
}, info) => {
  await page.goto('/responsable');
  const navigation = page.getByRole('navigation', { name: 'Navigation Responsable' });
  const toggle = page.getByRole('button', { name: /la navigation/ });
  const mobile = (page.viewportSize()?.width ?? 0) <= 760;

  if (mobile) {
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(navigation).toBeHidden();
    await toggle.tap();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  } else {
    await expect(toggle).toBeHidden();
  }
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link')).toHaveCount(page.viewportSize()!.width < 1200 ? 6 : 5);
  await expectNoHorizontalOverflow(page);
  await capture(page, info, 'navigation-responsable');
  await navigation.getByRole('link', { name: 'Matériel', exact: true }).click();
  await expect(page).toHaveURL(/\/responsable\/equipements$/);
  await expect(page.getByRole('main').getByRole('heading', { name: 'Matériel' })).toBeVisible();
  if (mobile) {
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(navigation).toBeHidden();
    await expect(page.getByRole('main')).toBeFocused();
  }
  await expectNoHorizontalOverflow(page);
});

test('Le lien d’évitement donne accès au contenu au clavier', async ({ page }) => {
  await page.goto('/agent');
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

for (const timezoneId of ['Europe/Paris', 'America/New_York']) {
  test.describe(`Programmation Responsable — ${timezoneId}`, () => {
    test.use({ timezoneId });
    test('La programmation valide, se modifie et revient aux filtres sans enregistrer', async ({
      page,
    }, info) => {
      // À cet instant, Paris est déjà le 31 et New York encore le 30 : ne pas tronquer une date UTC.
      await page.clock.setFixedTime(new Date('2026-10-30T23:30:00Z'));
      const today = timezoneId === 'Europe/Paris' ? '2026-10-31' : '2026-10-30';
      const yesterday = timezoneId === 'Europe/Paris' ? '2026-10-30' : '2026-10-29';
      const formatted = timezoneId === 'Europe/Paris' ? '31/10/2026' : '30/10/2026';
      const query = { q: '  EQ-BAT  ', priority: 'high', status: 'in-progress' };
      const list = '/responsable/incidents';
      const detail = `${list}/INC-2026-047`;
      const planning = '/responsable/interventions/nouvelle/INC-2026-047';
      const main = page.getByRole('main');
      const title = main.getByRole('textbox', {
        name: 'Titre de l’intervention (obligatoire)',
        exact: true,
      });
      const instructions = main.getByRole('textbox', {
        name: 'Consignes (facultatives)',
        exact: true,
      });
      const agent = main.getByRole('combobox', {
        name: 'Agent à affecter (obligatoire)',
        exact: true,
      });
      const date = main.getByLabel('Date prévue (obligatoire)', { exact: true });
      const verify = main.getByRole('button', { name: 'Vérifier l’intervention', exact: true });
      const businessRequests: string[] = [];
      page.on('request', (request) => {
        if (new URL(request.url()).pathname.startsWith('/api/'))
          businessRequests.push(request.url());
      });
      await page.goto(`${list}?${new URLSearchParams(query)}`);
      await expect(main.locator('tbody tr')).toHaveCount(1);
      const incident = main.getByRole('link', { name: /INC-2026-047/ });
      await incident.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL((url) => url.pathname === detail);
      await expectIncidentsActive(page, 'responsable');
      await expect(main).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(
        main.getByRole('link', { name: 'Retour aux signalements', exact: true }),
      ).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(main.getByRole('link', { name: 'Voir le matériel', exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
      const intervention = main
        .getByRole('region', { name: 'Interventions liées', exact: true })
        .getByRole('link');
      await expect(intervention).toHaveCount(1);
      await expect(intervention).toHaveAttribute('href', '/responsable/interventions/INT-2026-034');
      await expectFocusedControlVisible(page, intervention, 'responsable');
      await page.keyboard.press('Tab');
      const open = main.getByRole('link', { name: 'Programmer une intervention', exact: true });
      await expectFocusedControlVisible(page, open, 'responsable');
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(
        (url) => url.pathname === planning && url.searchParams.get('q') === query.q,
      );
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(
        'Programmer une intervention',
      );
      const active = page.locator('nav a[aria-current="page"]');
      await expect(active).toHaveCount(1);
      await expect(active).toHaveAttribute('href', '/responsable/interventions');
      if (page.viewportSize()!.width <= 760) {
        await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
        await expect(active).toBeVisible();
        await page.getByRole('button', { name: 'Fermer la navigation', exact: true }).click();
      }
      await expect(title).toHaveValue(/Température irrégulière/);
      await expect(instructions).toHaveValue('');
      await expect(agent).toHaveValue('');
      await expect(date).toHaveValue('');
      await expect(date).toHaveAttribute('min', today);
      await expect(main.locator('.origin-summary')).toContainText('INC-2026-047');
      await expect(main.locator('.origin-summary')).toContainText('Haute');
      await expect(main.locator('.origin-summary')).toContainText('Chaudière du groupe scolaire');
      await expect(main.locator('.origin-summary')).toContainText('École des Marronniers');
      await expectNoHorizontalOverflow(page);
      await capture(page, info, 'intervention-formulaire');
      await main.focus();
      await page.keyboard.press('Tab');
      await expect(
        main.getByRole('link', { name: 'Retour au signalement', exact: true }),
      ).toBeFocused();
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, title, 'responsable');
      await title.fill('   ');
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, instructions, 'responsable');
      await page.keyboard.press('Shift+Tab');
      await expectFocusedControlVisible(page, title, 'responsable');
      await date.fill(yesterday);
      await verify.focus();
      await page.keyboard.press('Enter');
      await expect(main.locator('.error')).toHaveCount(3);
      await expectFocusedControlVisible(page, title, 'responsable');
      await expect(date).toHaveValue(yesterday);
      await expect(title).toHaveAttribute('aria-describedby', /planning-title-error/);
      await capture(page, info, 'intervention-erreurs');
      const enteredTitle = '  Diagnostic du chauffage  ';
      await title.fill(enteredTitle);
      await instructions.fill('   \n  ');
      await instructions.focus();
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, agent, 'responsable');
      await agent.selectOption('AG-DEMO-002');
      await date.fill(today);
      await verify.focus();
      await page.keyboard.press('Enter');
      const reviewHeading = main.getByRole('heading', {
        name: 'Vérifier l’intervention',
        exact: true,
      });
      await expect(reviewHeading).toBeFocused();
      await expect(main.locator('dd').nth(0)).toHaveText(enteredTitle);
      await expect(main.locator('dd').nth(1)).toHaveText('Non renseignées');
      await expect(main.locator('dd').nth(2)).toHaveText('Alex Martin');
      await expect(main.locator('time')).toHaveText(formatted);
      await expect(active).toHaveAttribute('href', '/responsable/interventions');
      await expectNoHorizontalOverflow(page);
      const program = main.getByRole('button', { name: 'Programmer l’intervention', exact: true });
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, program, 'responsable');
      await expect(program).not.toHaveAttribute('aria-describedby', /planning-demo/);
      await expect(main.locator('#planning-demo-notice')).toHaveCount(0);
      await page.keyboard.press('Tab');
      const edit = main.getByRole('button', { name: 'Modifier l’intervention', exact: true });
      await expectFocusedControlVisible(page, edit, 'responsable');
      await page.keyboard.press('Enter');
      await expectFocusedControlVisible(page, title, 'responsable');
      await expect(title).toHaveValue(enteredTitle);
      await expect(instructions).toHaveValue('   \n  ');
      await expect(agent).toHaveValue('AG-DEMO-002');
      await expect(date).toHaveValue(today);
      const enteredInstructions = '  Contrôler la chaudière.\nVérifier le panneau de commande.  ';
      await instructions.fill(enteredInstructions);
      await verify.click();
      await expect(main.locator('dd').nth(1)).toHaveText(enteredInstructions);
      await expect(main.locator('time')).toHaveText(formatted);
      await expectNoHorizontalOverflow(page);
      await capture(page, info, 'intervention-recapitulatif');
      await program.focus();
      await expectFocusedControlVisible(page, program, 'responsable');
      await page.keyboard.press('Enter');
      const completeHeading = main.getByRole('heading', {
        name: 'Programmation terminée',
        exact: true,
      });
      await expect(completeHeading).toBeFocused();
      await expect(main.getByRole('link', { name: 'Retour au signalement', exact: true })).toHaveAttribute('href', /\/responsable\/incidents\/INC-/);
      await expect(main).not.toContainText('notifié');
      await expect(main.getByText('Données de démonstration', { exact: true })).toHaveCount(0);
      await expect(active).toHaveAttribute('href', '/responsable/interventions');
      await expectNoHorizontalOverflow(page);
      await capture(page, info, 'intervention-confirmation');
      expect(businessRequests).toEqual([]);
      expect(
        await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
      ).toEqual({ local: 0, session: 0 });
      expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
      expect(Object.fromEntries(new URL(page.url()).searchParams)).toEqual(query);
      await page.keyboard.press('Tab');
      const created = main.getByRole('link', { name: 'Voir l’intervention', exact: true });
      await expectFocusedControlVisible(page, created, 'responsable');
      await page.keyboard.press('Tab');
      const back = main.getByRole('link', { name: 'Retour au signalement', exact: true });
      await expectFocusedControlVisible(page, back, 'responsable');
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL((url) => url.pathname === detail);
      await expectIncidentsActive(page, 'responsable');
      await main.getByRole('link', { name: 'Retour aux signalements', exact: true }).click();
      await expect(main.getByRole('searchbox')).toHaveValue(query.q);
      await expect(main.getByRole('combobox', { name: 'Priorité', exact: true })).toHaveValue(
        query.priority,
      );
      await expect(
        main.getByRole('combobox', { name: 'Statut du signalement', exact: true }),
      ).toHaveValue(query.status);
      await expect(main.locator('tbody tr')).toHaveCount(1);
      await page.reload();
      await expect(main.locator('tbody tr')).toHaveCount(1);
      await expect(main.getByRole('searchbox')).toHaveValue(query.q);
    });
  });
}

test('La programmation gère accès direct, rechargement, annulation, clôturé et inconnu', async ({
  page,
}, info) => {
  await page.clock.setFixedTime(new Date('2026-10-30T12:00:00Z'));
  const main = page.getByRole('main');
  const base = '/responsable/interventions/nouvelle';
  const filters = new URLSearchParams({ q: '  Moteur  ', priority: 'low', status: 'open' });
  await page.goto(`${base}/INC-2026-045?${filters}`);
  await expect(main.locator('.origin-summary')).toContainText('Débroussailleuse n°3');
  const title = main.getByLabel('Titre de l’intervention (obligatoire)', { exact: true });
  await title.fill('Saisie à oublier');
  await main.getByLabel('Consignes (facultatives)', { exact: true }).fill('Consignes à oublier');
  await main
    .getByLabel('Agent à affecter (obligatoire)', { exact: true })
    .selectOption('AG-DEMO-003');
  await main.getByLabel('Date prévue (obligatoire)', { exact: true }).fill('2026-10-31');
  await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Vérifier l’intervention');
  await page.reload();
  await expect(title).toHaveValue('Moteur qui cale à l’accélération');
  await expect(main.getByLabel('Consignes (facultatives)', { exact: true })).toHaveValue('');
  await expect(main.getByLabel('Agent à affecter (obligatoire)', { exact: true })).toHaveValue('');
  await expect(main.getByLabel('Date prévue (obligatoire)', { exact: true })).toHaveValue('');
  await main.getByRole('link', { name: 'Annuler', exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === '/responsable/incidents/INC-2026-045');
  await main.getByRole('link', { name: 'Retour aux signalements', exact: true }).click();
  await expect(main.getByRole('searchbox')).toHaveValue('  Moteur  ');
  await expect(main.locator('tbody tr')).toHaveCount(1);
  await page.goto('/responsable/incidents/INC-2026-049');
  await expect(main).toContainText('Ce signalement est clôturé');
  await expect(
    main.getByRole('link', { name: 'Programmer une intervention', exact: true }),
  ).toHaveCount(0);
  await page.goto(`${base}/INC-2026-049`);
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalement clôturé');
  await expect(main.locator('form')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await capture(page, info, 'intervention-signalement-cloture');
  await main.getByRole('link', { name: 'Retour au signalement', exact: true }).click();
  await expect(page).toHaveURL('/responsable/incidents/INC-2026-049');
  await page.goto(`${base}/inconnu?q=OUT&priority=invalide&status=invalide`);
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalement introuvable');
  await expect(main.locator('form')).toHaveCount(0);
  await expect(main.locator('.origin-summary')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await capture(page, info, 'intervention-signalement-introuvable');
  await expect(
    main.getByRole('link', { name: 'Retour aux signalements', exact: true }),
  ).toHaveAttribute('href', '/responsable/incidents?q=OUT');
});

test('La consultation Agent conserve ses liens sans programmation', async ({ page }) => {
  const main = page.getByRole('main');
  for (const id of ['INC-2026-045', 'INC-2026-047', 'INC-2026-049']) {
    await page.goto(`/agent/incidents/${id}`);
    await expect(main.getByRole('link', { name: 'Voir le matériel', exact: true })).toBeVisible();
    await expect(
      main.getByRole('link', { name: 'Programmer une intervention', exact: true }),
    ).toHaveCount(0);
    await expectIncidentsActive(page, 'agent');
    await expectNoHorizontalOverflow(page);
  }
  await page.goto('/agent/interventions/nouvelle/INC-2026-045');
  await expect(page).toHaveURL('/');
  await expect(main.getByRole('heading', { level: 1 })).toContainText('Du terrain');
  await expect(main.getByRole('status')).toContainText('API disponible');
  await expect(main.locator('form')).toHaveCount(0);
  await expect(page.locator('nav a[href="/agent/interventions"]')).toHaveCount(1);
  for (const path of ['/agent/interventions', '/agent/interventions/INT-2026-032']) {
    await page.goto(path);
    await expect(page).toHaveURL(path);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(
      path.endsWith('032')
        ? 'Diagnostic et remise en état du système d’alimentation'
        : 'Mes interventions',
    );
    await expect(main.locator('form')).toHaveCount(0);
    await expect(page.locator('nav a[href="/agent/interventions"]')).toHaveCount(1);
  }
});

async function expectInterventionsActive(page: Page): Promise<void> {
  const active = page.locator('nav a[aria-current="page"]');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute('href', '/responsable/interventions');
  if (page.viewportSize()!.width <= 760) {
    await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
    await expect(active).toBeVisible();
    await expect(active).toHaveClass(/active/);
    await page.getByRole('button', { name: 'Fermer la navigation', exact: true }).click();
  } else {
    await expect(active).toBeVisible();
  }
}

for (const timezoneId of ['Europe/Paris', 'America/New_York']) {
  test.describe(`Consultation des interventions — ${timezoneId}`, () => {
    test.use({ timezoneId });
    test('La liste combine les critères, les conserve au retour et au rechargement, puis les réinitialise au clavier', async ({
      page,
    }, info) => {
      const base = '/responsable/interventions';
      const main = page.getByRole('main');
      const rows = main.locator('tbody tr');
      const search = main.getByRole('searchbox', {
        name: 'Rechercher une intervention',
        exact: true,
      });
      const status = main.getByRole('combobox', { name: 'Statut de l’intervention', exact: true });
      const assignee = main.getByRole('combobox', { name: 'Agent affecté', exact: true });
      const reset = main.getByRole('button', { name: 'Réinitialiser les filtres', exact: true });
      const query = '  EQ-OUT  ';
      await page.goto(base);
      await expect(rows).toHaveCount(6);
      await expect(main.getByRole('status')).toHaveText('6 interventions trouvées sur 6.');
      await expect(main.getByText('Données de démonstration', { exact: true })).toHaveCount(0);
      await expect(main.locator('.status-counts dd')).toHaveText(['2', '2', '2']);
      await expect(rows.locator('time')).toHaveText([
        '03/11/2026',
        '02/11/2026',
        '31/10/2026',
        '30/10/2026',
        '24/10/2026',
        '23/10/2026',
      ]);
      await expect(main.getByRole('table').getByRole('columnheader')).toHaveCount(5);
      expect(
        await main.locator('table').evaluate((element) => getComputedStyle(element).display),
      ).toBe(page.viewportSize()!.width === 1440 ? 'table' : 'block');
      await expectInterventionsActive(page);
      await expectNoHorizontalOverflow(page);
      await capture(page, info, 'interventions-liste');
      const longTitle = rows.getByRole('link', { name: /INT-2026-034/ });
      await longTitle.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expectFocusedControlVisible(page, longTitle, 'responsable');
      expect(await longTitle.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe(
        'solid',
      );
      await capture(page, info, 'intervention-titre-long-focus');
      await main.focus();
      const historyLength = await page.evaluate(() => history.length);
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, search, 'responsable');
      await page.keyboard.type(query);
      await expect(rows).toHaveCount(4);
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, status, 'responsable');
      await status.selectOption('in-progress');
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, assignee, 'responsable');
      await assignee.selectOption('AG-DEMO-001');
      await expect(rows).toHaveCount(1);
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === base &&
          url.searchParams.get('q') === query &&
          url.searchParams.get('status') === 'in-progress' &&
          url.searchParams.get('assignee') === 'AG-DEMO-001',
      );
      expect(await page.evaluate(() => history.length)).toBe(historyLength);
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, reset, 'responsable');
      await page.keyboard.press('Tab');
      const open = rows.getByRole('link', { name: /INT-2026-035.*Vérification du plateau/ });
      await expectFocusedControlVisible(page, open, 'responsable');
      await capture(page, info, 'interventions-filtres');
      await page.keyboard.press('Enter');
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(
        'Vérification du plateau de coupe',
      );
      await expect(main.locator('.instructions')).toHaveText('Non renseignées');
      await expect(main.locator('time')).toHaveText('30/10/2026');
      await expectInterventionsActive(page);
      await expectNoHorizontalOverflow(page);
      await capture(page, info, 'intervention-detail-sans-consignes');
      await main.focus();
      await page.keyboard.press('Tab');
      const back = main.getByRole('link', { name: 'Retour aux interventions', exact: true });
      await expectFocusedControlVisible(page, back, 'responsable');
      await page.keyboard.press('Enter');
      for (const reload of [false, true]) {
        if (reload) await page.reload();
        await expect(search).toHaveValue(query);
        await expect(status).toHaveValue('in-progress');
        await expect(assignee).toHaveValue('AG-DEMO-001');
        await expect(rows).toHaveCount(1);
      }
      await status.selectOption('completed');
      await expect(rows).toHaveCount(0);
      await expect(main.getByRole('status')).toHaveText('0 intervention trouvée sur 6.');
      await expect(main).toContainText('Aucune intervention ne correspond');
      await expectNoHorizontalOverflow(page);
      await capture(page, info, 'interventions-aucun-resultat');
      await reset.focus();
      await page.keyboard.press('Enter');
      await expectFocusedControlVisible(page, search, 'responsable');
      await expect(rows).toHaveCount(6);
      await expect(page).toHaveURL((url) => url.pathname === base && url.search === '');
      await search.fill('x'.repeat(350));
      await expect(rows).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await reset.click();
      await expect(rows).toHaveCount(6);
    });

    test('Le détail direct conserve les critères et les dates, lie les origines sans filtres et gère l’inconnu', async ({
      page,
    }, info) => {
      const base = '/responsable/interventions';
      const main = page.getByRole('main');
      const filters = { q: '  CHAUDIÈRE  ', status: 'in-progress', assignee: 'AG-DEMO-002' };
      const url = `${base}/INT-2026-034?${new URLSearchParams(filters)}`;
      await page.goto(url);
      await expect(main.getByRole('heading', { level: 1 })).toContainText(
        'Diagnostic du chauffage',
      );
      await expect(main.locator('.instructions')).toContainText('Examiner le panneau de commande');
      await expect(main.locator('.equipment-summary')).toContainText('École des Marronniers');
      await expect(main.locator('.metadata')).toContainText('Alex Martin');
      await expect(main.locator('time')).toHaveText('31/10/2026');
      await expect(main.locator('time')).toHaveAttribute('datetime', '2026-10-31');
      await expectInterventionsActive(page);
      await expectNoHorizontalOverflow(page);
      await capture(page, info, 'intervention-detail-long');
      await page.reload();
      await expect(main.locator('time')).toHaveText('31/10/2026');
      const back = main.getByRole('link', { name: 'Retour aux interventions', exact: true });
      await expect(back).toHaveAttribute(
        'href',
        url.replace('/INT-2026-034', '').replaceAll('+', '%20'),
      );
      await expect(main).toBeFocused();
      await page.keyboard.press('Tab');
      await expectFocusedControlVisible(page, back, 'responsable');
      await page.keyboard.press('Tab');
      const incident = main.getByRole('link', { name: 'Voir le signalement', exact: true });
      await expectFocusedControlVisible(page, incident, 'responsable');
      await expect(incident).toHaveAttribute('href', '/responsable/incidents/INC-2026-047');
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL('/responsable/incidents/INC-2026-047');
      await expectIncidentsActive(page, 'responsable');
      await main.getByRole('link', { name: 'Retour aux signalements', exact: true }).click();
      await expect(main.getByRole('searchbox')).toHaveValue('');
      await expect(main.locator('tbody tr')).toHaveCount(6);
      await page.goto(url);
      await expect(main).toBeFocused();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      const material = main.getByRole('link', { name: 'Voir le matériel', exact: true });
      await expectFocusedControlVisible(page, material, 'responsable');
      await expect(material).toHaveAttribute('href', '/responsable/equipements/EQ-BAT-0011');
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL('/responsable/equipements/EQ-BAT-0011');
      await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute(
        'href',
        '/responsable/equipements',
      );
      await page.goBack();
      await expect(main.getByRole('heading', { level: 1 })).toContainText(
        'Diagnostic du chauffage',
      );
      await back.click();
      await expect(main.getByRole('searchbox')).toHaveValue(filters.q);
      await expect(main.locator('tbody tr')).toHaveCount(1);
      await page.goto(
        `${base}/inconnu?${new URLSearchParams({ q: '  tONDEUSE  ', status: 'toString', assignee: 'inconnu' })}`,
      );
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Intervention introuvable');
      await expect(
        main.getByRole('link', { name: 'Voir le signalement', exact: true }),
      ).toHaveCount(0);
      await expect(main.getByRole('link', { name: 'Voir le matériel', exact: true })).toHaveCount(
        0,
      );
      await expectInterventionsActive(page);
      await expectNoHorizontalOverflow(page);
      await capture(page, info, 'intervention-introuvable');
      await back.click();
      await expect(main.getByRole('searchbox')).toHaveValue('  tONDEUSE  ');
      await expect(
        main.getByRole('combobox', { name: 'Statut de l’intervention', exact: true }),
      ).toHaveValue('');
      await expect(main.getByRole('combobox', { name: 'Agent affecté', exact: true })).toHaveValue(
        '',
      );
      await expect(main.locator('tbody tr')).toHaveCount(1);
      await expect(main.locator('tbody')).toContainText('INT-2026-035');
      await expect(page).toHaveURL((current) => current.searchParams.size === 1);
    });
  });
}

test('Déclarer puis programmer ajoute en mémoire sans écriture métier ni stockage persistant', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-31T12:00:00Z'));
  const main = page.getByRole('main');
  const base = '/responsable/interventions';
  const navigate = async (name: string) => {
    if (page.viewportSize()!.width <= 760) {
      await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
    }
    await page.locator('nav').getByRole('link', { name, exact: true }).click();
  };
  const requests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.url());
  });
  await page.goto(base);
  await expect(main.locator('tbody tr')).toHaveCount(6);
  const initial = await main.locator('tbody').innerText();
  // Rester dans la même application : recharger pourrait masquer une mutation en mémoire.
  await navigate('Matériel');
  await main.getByRole('link', { name: /Débroussailleuse n°3/ }).click();
  await main.getByRole('link', { name: 'Déclarer un incident', exact: true }).click();
  await main.getByLabel('Intitulé', { exact: true }).fill('Exemple ajouté en mémoire');
  await main.getByRole('radio', { name: 'Basse — intervention à planifier', exact: true }).check();
  await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
  await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalement terminé');
  await navigate('Interventions');
  await expect(main.locator('tbody tr')).toHaveCount(6);
  expect(await main.locator('tbody').innerText()).toBe(initial);
  await navigate('Incidents');
  await main.getByRole('link', { name: /INC-2026-045/ }).click();
  await main.getByRole('link', { name: 'Programmer une intervention', exact: true }).click();
  await main
    .getByLabel('Titre de l’intervention (obligatoire)', { exact: true })
    .fill('Intervention ajoutée en mémoire');
  await main
    .getByLabel('Agent à affecter (obligatoire)', { exact: true })
    .selectOption('AG-DEMO-002');
  await main.getByLabel('Date prévue (obligatoire)', { exact: true }).fill('2026-11-03');
  await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
  await main.getByRole('button', { name: 'Programmer l’intervention', exact: true }).click();
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Programmation terminée');
  await navigate('Interventions');
  await expect(main.locator('tbody tr')).toHaveCount(7);
  await expect(main.locator('tbody')).toContainText('Intervention ajoutée en mémoire');
  for (const id of initial.match(/INT-2026-\d+/g) ?? [])
    await expect(main.locator('tbody')).toContainText(id);
  expect(requests).toEqual([]);
  expect(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
  ).toEqual({ local: 0, session: 0 });
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});

async function expectPageAction(
  page: Page,
  action: Locator,
  level: 'primary' | 'secondary',
  space: string,
): Promise<void> {
  await expect(action).toHaveClass(/page-action/);
  await action.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(action).toHaveCSS(
    'background-color',
    level === 'primary' ? 'rgb(35, 78, 63)' : 'rgb(255, 255, 255)',
  );
  await expect(action).toHaveCSS(
    'color',
    level === 'primary' ? 'rgb(255, 255, 255)' : 'rgb(35, 78, 63)',
  );
  await expect(action).toHaveCSS('text-decoration-line', 'none');
  expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  await action.hover();
  await expect(action).toHaveCSS('text-decoration-line', 'none');
  // Tab établit une interaction clavier avant le focus programmatique sur la cible testée.
  await page.keyboard.press('Tab');
  await action.focus();
  await expectFocusedControlVisible(page, action, space);
  await expect(action).toHaveCSS('text-decoration-line', 'none');
  await expect(action).toHaveCSS('outline-style', 'solid');
  await expect(action).toHaveCSS('outline-width', '3px');
}

async function expectBackAction(page: Page, back: Locator, space: string): Promise<void> {
  await expect(back.locator('span[aria-hidden="true"]')).toHaveText('←');
  await expectPageAction(page, back, 'secondary', space);
}

async function expectBusinessCard(card: Locator): Promise<void> {
  await expect(card).toHaveCSS('background-color', 'rgb(244, 248, 245)');
  await expect(card).toHaveCSS('border-top-width', '1px');
}

for (const space of ['agent', 'responsable']) {
  test(`L’harmonisation UX de ${space} conserve Basse/low, les liens, les retours et les formulaires au clavier`, async ({
    page,
  }, info) => {
    const main = page.getByRole('main');
    await page.goto(`/${space}`);
    await expect(main.locator('.back-link')).toHaveCount(0);
    if (space === 'responsable') {
      await expectPageAction(page, main.getByRole('link', { name: 'Matériel', exact: true }), 'secondary', space);
    } else {
      await expect(main.getByRole('link', { name: 'Voir toutes mes interventions', exact: true })).toBeVisible();
    }
    const q = '  EQ-OUT-0003  ';
    const base = `/${space}/equipements`;
    const detail = `${base}/EQ-OUT-0003`;
    await page.goto(`${base}?${new URLSearchParams({ q })}`);
    await expect(main.locator('.back-link')).toHaveCount(0);
    await expectBusinessCard(main.getByRole('listitem'));
    const equipment = main.getByRole('link', { name: 'Débroussailleuse n°3', exact: true });
    await expect(equipment.locator('h2')).toHaveCSS('text-decoration-line', 'underline');
    await equipment.focus();
    await page.keyboard.press('Enter');
    const back = main.getByRole('link', { name: 'Retour au matériel', exact: true });
    await expectBackAction(page, back, space);
    await expectBusinessCard(main.locator('dl'));
    const declare = main.getByRole('link', { name: 'Déclarer un incident', exact: true });
    await expectPageAction(page, declare, 'primary', space);
    await expect(declare).toHaveAttribute(
      'href',
      `/${space}/incidents/nouveau/EQ-OUT-0003?q=${encodeURIComponent(q)}`,
    );
    await expectNoHorizontalOverflow(page);
    await info.attach('ux-fiche-materiel-focus-fenetre', {
      body: await page.screenshot({ animations: 'disabled' }),
      contentType: 'image/png',
    });
    await capture(page, info, 'ux-fiche-materiel-actions');
    await page.keyboard.press('Enter');
    await expectIncidentsActive(page, space);
    const formBack = main.getByRole('link', { name: 'Retour à la fiche matériel', exact: true });
    await expectBackAction(page, formBack, space);
    await page.reload();
    await expect(formBack).toHaveAttribute('href', `${detail}?q=${encodeURIComponent(q)}`);
    await expect(main.getByText('Données de démonstration', { exact: true })).toHaveCount(0);
    await expectBusinessCard(main.locator('.equipment-summary'));
    await main
      .getByRole('textbox', { name: 'Intitulé', exact: true })
      .fill('Contrôle de démonstration');
    const low = main.getByRole('radio', { name: 'Basse — intervention à planifier', exact: true });
    await expect(low).toHaveAttribute('id', 'priority-low');
    await low.check();
    await expect(low).toBeChecked();
    await expect(main).not.toContainText('Faible');
    const verify = main.getByRole('button', { name: 'Vérifier le signalement', exact: true });
    await expect(verify).toHaveAttribute('type', 'submit');
    await expectPageAction(page, verify, 'primary', space);
    await capture(page, info, 'ux-declaration-basse');
    await page.keyboard.press('Enter');
    await expect(main.locator('.review-values')).toContainText('Basse — intervention à planifier');
    await expectBusinessCard(main.locator('.review-values'));
    const edit = main.getByRole('button', { name: 'Modifier le signalement', exact: true });
    await expectPageAction(page, edit, 'secondary', space);
    const cancel = main.getByRole('link', { name: 'Annuler', exact: true });
    await expectPageAction(page, cancel, 'secondary', space);
    await expect(cancel).toHaveAttribute('href', `${detail}?q=${encodeURIComponent(q)}`);
    const send = main.getByRole('button', { name: 'Envoyer le signalement', exact: true });
    await expectPageAction(page, send, 'primary', space);
    await capture(page, info, 'ux-recapitulatif-signalement');
    await page.keyboard.press('Enter');
    const completedBack = main.getByRole('link', { name: 'Retour à la fiche', exact: true });
    await expect(completedBack.locator('span[aria-hidden="true"]')).toHaveText('←');
    await expectPageAction(page, completedBack, 'primary', space);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      (url) => url.pathname === detail && url.searchParams.get('q') === q,
    );

    const filters = { q: '  mOTEUR  ', priority: 'low', status: 'open' };
    await page.goto(`/${space}/incidents?${new URLSearchParams(filters)}`);
    await expect(main.getByRole('combobox', { name: 'Priorité', exact: true })).toHaveValue('low');
    await expect(main.locator('option[value="low"]')).toHaveText('Basse');
    await expect(main.locator('[data-priority="low"]')).toHaveText('Basse');
    const incident = main.getByRole('link', { name: /INC-2026-045/ });
    await expect(incident).toHaveCSS('text-decoration-line', 'underline');
    await incident.focus();
    await page.keyboard.press('Enter');
    await expect(main.locator('[data-priority="low"]')).toHaveText('Basse');
    await expectBusinessCard(main.locator('.metadata'));
    await expectBusinessCard(main.locator('.equipment-summary'));
    const material = main.getByRole('link', { name: 'Voir le matériel', exact: true });
    await expectPageAction(page, material, 'secondary', space);
    await expect(material).toHaveAttribute('href', detail);
    await expectNoHorizontalOverflow(page);
    await capture(page, info, 'ux-fiche-signalement-actions');
    const backToIncidents = main.getByRole('link', {
      name: 'Retour aux signalements',
      exact: true,
    });
    await expectBackAction(page, backToIncidents, space);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `/${space}/incidents` &&
        url.searchParams.get('q') === filters.q &&
        url.searchParams.get('priority') === 'low' &&
        url.searchParams.get('status') === 'open',
    );
  });
}

test('L’harmonisation de la programmation conserve les liens, Basse et les critères d’origine', async ({
  page,
}, info) => {
  await page.clock.setFixedTime(new Date('2026-10-31T12:00:00Z'));
  const main = page.getByRole('main');
  const filters = { q: '  mOTEUR  ', priority: 'low', status: 'open' };
  const incident = '/responsable/incidents/INC-2026-045';
  await page.goto(`${incident}?${new URLSearchParams(filters)}`);
  const open = main.getByRole('link', { name: 'Programmer une intervention', exact: true });
  await expectPageAction(page, open, 'primary', 'responsable');
  await page.keyboard.press('Enter');
  const back = main.getByRole('link', { name: 'Retour au signalement', exact: true });
  await expectBackAction(page, back, 'responsable');
  await page.reload();
  await expect(back).toHaveAttribute(
    'href',
    `${incident}?q=${encodeURIComponent(filters.q)}&priority=low&status=open`,
  );
  await expect(main.locator('.origin-summary')).toContainText('Priorité : Basse');
  await expectBusinessCard(main.locator('.origin-summary'));
  await main
    .getByLabel('Agent à affecter (obligatoire)', { exact: true })
    .selectOption('AG-DEMO-001');
  await main.getByLabel('Date prévue (obligatoire)', { exact: true }).fill('2026-11-03');
  const verify = main.getByRole('button', { name: 'Vérifier l’intervention', exact: true });
  await expectPageAction(page, verify, 'primary', 'responsable');
  await page.keyboard.press('Enter');
  await expectBusinessCard(main.locator('.review-values'));
  await expectPageAction(
    page,
    main.getByRole('button', { name: 'Modifier l’intervention', exact: true }),
    'secondary',
    'responsable',
  );
  await expectPageAction(
    page,
    main.getByRole('link', { name: 'Annuler', exact: true }),
    'secondary',
    'responsable',
  );
  const program = main.getByRole('button', { name: 'Programmer l’intervention', exact: true });
  await expectPageAction(page, program, 'primary', 'responsable');
  await expectInterventionsActive(page);
  await program.focus();
  await expectNoHorizontalOverflow(page);
  await capture(page, info, 'ux-programmation-actions');
  await page.keyboard.press('Enter');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Programmation terminée');
  const completedBack = main.getByRole('link', { name: 'Retour au signalement', exact: true });
  await expect(completedBack.locator('span[aria-hidden="true"]')).toHaveText('←');
  await expectPageAction(page, completedBack, 'primary', 'responsable');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === incident &&
      url.searchParams.get('priority') === 'low' &&
      url.searchParams.get('q') === filters.q,
  );
});

test('Les actions du détail d’intervention restent des liens et distinguent leur importance', async ({
  page,
  context,
}, info) => {
  const main = page.getByRole('main');
  const base = '/responsable/interventions';
  const query = { q: '  EQ-OUT  ', status: 'planned', assignee: 'AG-DEMO-001' };
  await page.goto(`${base}/INT-2026-032?${new URLSearchParams(query)}`);
  await page.reload();
  const back = main.getByRole('link', { name: 'Retour aux interventions', exact: true });
  await expectBackAction(page, back, 'responsable');
  for (const selector of ['.intervention-summary', '.origin-summary', '.equipment-summary']) {
    await expectBusinessCard(main.locator(selector));
  }
  const incident = main.getByRole('link', { name: 'Voir le signalement', exact: true });
  const material = main.getByRole('link', { name: 'Voir le matériel', exact: true });
  await expectPageAction(page, material, 'secondary', 'responsable');
  await expect(material).toHaveAttribute('href', '/responsable/equipements/EQ-OUT-0003');
  await expectPageAction(page, incident, 'primary', 'responsable');
  await expect(incident).toHaveAttribute('href', '/responsable/incidents/INC-2026-045');
  await expectInterventionsActive(page);
  await expectNoHorizontalOverflow(page);
  await capture(page, info, 'ux-fiche-intervention-actions');
  if (page.viewportSize()!.width === 1440) {
    const popupPromise = context.waitForEvent('page');
    await incident.click({ modifiers: ['ControlOrMeta'] });
    const popup = await popupPromise;
    await expect(popup).toHaveURL('/responsable/incidents/INC-2026-045');
    await expect(popup.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(
      'Moteur qui cale à l’accélération',
    );
    await popup.close();
  }
  await expectBackAction(page, back, 'responsable');
  await page.keyboard.press('Enter');
  await expect(main.getByRole('searchbox')).toHaveValue(query.q);
  await expect(
    main.getByRole('combobox', { name: 'Statut de l’intervention', exact: true }),
  ).toHaveValue(query.status);
  await expect(main.getByRole('combobox', { name: 'Agent affecté', exact: true })).toHaveValue(
    query.assignee,
  );
  await expect(main.locator('tbody tr')).toHaveCount(1);
});
