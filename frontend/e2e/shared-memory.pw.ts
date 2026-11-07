import { expect, test } from '@playwright/test';

for (const space of ['agent', 'responsable'] as const) {
  test(`Création partagée avec photos depuis ${space}, programmation puis rechargement`, async ({
    page,
  }, info) => {
    await page.clock.setFixedTime(new Date('2026-11-06T12:00:00Z'));
    await page.route('**/api/v1/health', (route) => route.fulfill({ json: { status: 'ok' } }));
    const errors: string[] = [];
    const writes: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url());
    });
    const main = page.getByRole('main');
    const navigate = async (currentSpace: string, name: string) => {
      if (page.viewportSize()!.width <= 760) {
        if (currentSpace === 'responsable')
          await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
        else if (name === 'Signalements') await page.getByRole('button', { name: /^Plus/ }).click();
      }
      const link = page.locator('nav').getByRole('link', { name, exact: true });
      const target = await link.getAttribute('href');
      await link.click();
      await expect(page).toHaveURL((url) => url.pathname === target);
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(name);
    };
    const fits = async () => {
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    };
    const incidentTitle = `Signalement partagé ${space}`;
    const interventionTitle = `Intervention partagée ${space}`;
    await page.goto(`/${space}/incidents`);
    // Le comptage doit suivre le rendu Angular, pas seulement la réponse HTML initiale.
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalements');
    await expect(main.locator('tbody tr').first()).toBeVisible();
    const initialIncidents = await main.locator('tbody tr').count();
    await navigate(space, 'Matériel');
    await main.getByRole('searchbox').fill('  Débroussailleuse  ');
    await main.getByRole('link', { name: /Débroussailleuse n°3/ }).click();
    await main.getByRole('link', { name: 'Faire un signalement', exact: true }).click();
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Faire un signalement');
    await main.getByLabel('Intitulé', { exact: true }).fill(incidentTitle);
    await main
      .getByRole('radio', { name: 'Basse — intervention à planifier', exact: true })
      .check();
    await main.locator('#gallery-file').setInputFiles('public/images/demo/mower.webp');
    await expect(main.getByRole('status').and(main.locator('#photos-status'))).toContainText('1 photo(s)');
    const preparedUrl = await main.locator('.photo-gallery img').getAttribute('src');
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await main
      .getByRole('button', { name: 'Envoyer le signalement', exact: true })
      .evaluate((button) => {
        (button as HTMLButtonElement).click();
        (button as HTMLButtonElement).click();
      });
    const viewIncident = main.getByRole('link', { name: 'Voir le signalement', exact: true });
    const incidentUrl = (await viewIncident.getAttribute('href'))!;
    await expect(
      main.getByRole('link', { name: 'Retour à la fiche', exact: true }),
    ).toHaveAttribute('href', /q=.*broussailleuse/);
    await viewIncident.focus();
    await expect(viewIncident).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(incidentTitle);
    await expect(main.locator('.photo-gallery img')).toHaveAttribute('src', preparedUrl!);
    await expect
      .poll(() =>
        main
          .locator('.photo-gallery img')
          .evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await fits();
    await main.getByRole('link', { name: 'Retour aux signalements', exact: true }).click();
    await expect(main.locator('tbody tr')).toHaveCount(initialIncidents + 1);
    await main.getByRole('searchbox').fill(incidentTitle);
    await expect(main.locator('tbody tr')).toHaveCount(1);
    await main.locator('tbody a').click();
    await expect(page).toHaveURL(
      (url) => url.pathname === incidentUrl && url.searchParams.get('q') === incidentTitle,
    );

    // Le menu change seulement la route Angular : aucun goto/rechargement ne masque la durée de vie.
    await page.locator('.space-menu > summary').click();
    await page.getByRole('link', { name: 'Espace Responsable', exact: true }).click();
    // Les deux espaces ont maintenant un lien Interventions : attendre le nouveau contexte.
    await expect(page).toHaveURL('/responsable');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Tableau de bord');
    await navigate('responsable', 'Interventions');
    const initialInterventions = await main.locator('tbody tr').count();
    await navigate('responsable', 'Signalements');
    await main.getByRole('searchbox').fill(incidentTitle);
    await main.getByRole('combobox', { name: 'Priorité', exact: true }).selectOption('low');
    await main
      .getByRole('combobox', { name: 'Statut du signalement', exact: true })
      .selectOption('open');
    await expect(main.locator('tbody tr')).toHaveCount(1);
    await main.locator('tbody a').click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(incidentTitle);
    const responsibleIncidentUrl = page.url();
    await expect(main.locator('.photo-gallery img')).toHaveAttribute('src', preparedUrl!);
    await expect
      .poll(() =>
        main
          .locator('.photo-gallery img')
          .evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await info.attach('signalement-partage-avec-photo', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await fits();
    await main.getByRole('link', { name: 'Programmer une intervention', exact: true }).click();
    await main
      .getByLabel('Titre de l’intervention (obligatoire)', { exact: true })
      .fill(interventionTitle);
    await main
      .getByLabel('Agent à affecter (obligatoire)', { exact: true })
      .selectOption('AG-DEMO-002');
    await main.getByLabel('Date prévue (obligatoire)', { exact: true }).fill('2026-11-07');
    await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
    await main
      .getByRole('button', { name: 'Programmer l’intervention', exact: true })
      .evaluate((button) => {
        (button as HTMLButtonElement).click();
        (button as HTMLButtonElement).click();
      });
    await expect(
      main.getByRole('link', { name: 'Retour au signalement', exact: true }),
    ).toHaveAttribute(
      'href',
      new URL(responsibleIncidentUrl).pathname + new URL(responsibleIncidentUrl).search,
    );
    const viewIntervention = main.getByRole('link', { name: 'Voir l’intervention', exact: true });
    await viewIntervention.focus();
    await page.keyboard.press('Enter');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(interventionTitle);
    const interventionUrl = page.url();
    await expect(main.locator('.metadata')).toContainText('Alex Martin');
    await expect(main.locator('.metadata')).toContainText('Planifiée');
    await expect(main.locator('time')).toHaveText('07/11/2026');
    await expect(main.locator('.origin')).toContainText(incidentTitle);
    await expect(main.locator('.equipment-summary')).toContainText('EQ-OUT-0003');
    await fits();
    await info.attach('intervention-partagee-relations', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await main.getByRole('link', { name: 'Retour aux interventions', exact: true }).click();
    await expect(main.locator('tbody tr')).toHaveCount(initialInterventions + 1);
    await main.getByRole('searchbox').fill(interventionTitle);
    await main
      .getByRole('combobox', { name: 'Statut de l’intervention', exact: true })
      .selectOption('planned');
    await main
      .getByRole('combobox', { name: 'Agent affecté', exact: true })
      .selectOption('AG-DEMO-002');
    await expect(main.locator('tbody tr')).toHaveCount(1);
    await main.locator('tbody a').click();
    await main.getByRole('link', { name: 'Retour aux interventions', exact: true }).click();
    await expect(main.getByRole('searchbox')).toHaveValue(interventionTitle);
    await expect(main.locator('tbody tr')).toHaveCount(1);
    await main.locator('tbody a').click();
    await page.reload();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Intervention introuvable');
    await main.getByRole('link', { name: 'Retour aux interventions', exact: true }).click();
    await main.getByRole('button', { name: 'Réinitialiser les filtres', exact: true }).click();
    await expect(main.locator('tbody tr')).toHaveCount(initialInterventions);
    await page.goto(incidentUrl);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalement introuvable');
    await main.getByRole('link', { name: 'Retour aux signalements', exact: true }).click();
    await expect(main.locator('tbody tr')).toHaveCount(initialIncidents);
    expect(interventionUrl).toContain('INT-LOCAL-');
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
    ).toEqual({ local: 0, session: 0 });
    expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  });
}
