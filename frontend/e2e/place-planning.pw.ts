import { expect, test, type Page } from '@playwright/test';

async function switchSpace(page: Page, space: 'Agent' | 'Responsable') {
  await page.locator('.space-menu > summary').click();
  await page.getByRole('link', { name: `Espace ${space}`, exact: true }).click();
  await expect(page).toHaveURL(`/${space.toLowerCase()}`);
}

async function navigate(page: Page, space: 'Agent' | 'Responsable', name: string) {
  if (page.viewportSize()!.width <= 760) {
    if (space === 'Responsable')
      await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
    else if (name === 'Signalements') await page.getByRole('button', { name: /^Plus/ }).click();
  }
  const link = page
    .getByRole('navigation', { name: `Navigation ${space}`, exact: true })
    .getByRole('link', { name, exact: true });
  const destination = new URL((await link.getAttribute('href'))!, page.url()).pathname;
  await link.click();
  await expect(page).toHaveURL((url) => url.pathname === destination);
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(
    space === 'Agent' && name === 'Interventions' ? 'Mes interventions' : name,
  );
}

for (const timezoneId of ['Europe/Paris', 'America/New_York']) {
  test.describe(timezoneId, () => {
    test.use({ timezoneId });
    test('Lieu écrit seul : signalement → programmation → consultation Responsable et Agent', async ({
      page,
    }, info) => {
      // À cet instant les deux fuseaux n'ont pas le même jour calendaire.
      await page.clock.setFixedTime(new Date('2026-11-13T00:30:00Z'));
      const today = timezoneId === 'Europe/Paris' ? '2026-11-13' : '2026-11-12';
      const displayedDate = timezoneId === 'Europe/Paris' ? '13/11/2026' : '12/11/2026';
      const errors: string[] = [];
      const writes: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('request', (request) => {
        if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url());
      });
      await page.goto('/agent/incidents/nouveau');
      const main = page.getByRole('main');
      const place = '  Rue des Écoles, entrée nord  ';
      await main.getByLabel('Lieu (obligatoire)', { exact: true }).fill(place);
      await main.getByLabel('Intitulé', { exact: true }).fill('Barrière endommagée');
      await main.getByRole('radio', { name: /Urgente/ }).check();
      await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
      await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
      await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
      await expect(main.locator('app-location-summary')).toHaveText('Aucune localisation ajoutée.');
      const incidentId = new URL(page.url()).pathname.split('/').pop()!;
      await expect(
        main.getByRole('link', { name: 'Programmer une intervention', exact: true }),
      ).toHaveCount(0);
      await switchSpace(page, 'Responsable');
      await navigate(page, 'Responsable', 'Signalements');
      await main.getByRole('searchbox').fill('  ÉCOLES  ');
      await main.getByLabel('Priorité', { exact: true }).selectOption('urgent');
      await main.getByLabel('Statut du signalement', { exact: true }).selectOption('open');
      await main.locator('tbody a').click();
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Barrière endommagée');
      const sourceUrl = page.url();
      const plan = main.getByRole('link', { name: 'Programmer une intervention', exact: true });
      await plan.focus();
      await page.keyboard.press('Enter');
      await expect(main.locator('.origin-summary')).toContainText(place.trim());
      await expect(
        main.getByLabel('Titre de l’intervention (obligatoire)', { exact: true }),
      ).toHaveValue('Barrière endommagée');
      await main.getByRole('link', { name: 'Annuler', exact: true }).click();
      await expect(page).toHaveURL(sourceUrl);
      await main.getByRole('link', { name: 'Programmer une intervention', exact: true }).click();
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Programmer une intervention');
      await expect(main).toBeFocused();
      const title = main.getByLabel('Titre de l’intervention (obligatoire)', { exact: true });
      const date = main.getByLabel('Date prévue (obligatoire)', { exact: true });
      await title.fill('   ');
      await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
      await expect(title).toBeFocused();
      await title.fill('Réparer la barrière du lieu');
      await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
      await expect(
        main.getByLabel('Agent à affecter (obligatoire)', { exact: true }),
      ).toBeFocused();
      await main
        .getByLabel('Agent à affecter (obligatoire)', { exact: true })
        .selectOption('AG-DEMO-001');
      await date.fill('2026-11-11');
      await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
      await expect(date).toHaveAttribute('aria-invalid', 'true');
      await expect(date).toHaveAttribute('min', today);
      await date.fill(today);
      await info.attach('programmation-lieu-formulaire', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
      await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
      await expect(main.locator('.origin-summary')).toContainText(place.trim());
      await expect(main.locator('.review-values')).toContainText(displayedDate);
      await main.getByRole('button', { name: 'Modifier l’intervention', exact: true }).click();
      await expect(title).toHaveValue('Réparer la barrière du lieu');
      await expect(date).toHaveValue(today);
      await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
      await main
        .getByRole('button', { name: 'Programmer l’intervention', exact: true })
        .evaluate((button: HTMLButtonElement) => {
          button.click();
          button.click();
        });
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Programmation terminée');
      const back = main.getByRole('link', { name: 'Retour au signalement', exact: true });
      await expect(back).toHaveAttribute(
        'href',
        new URL(sourceUrl).pathname + new URL(sourceUrl).search,
      );
      await main.getByRole('link', { name: 'Voir l’intervention', exact: true }).click();
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(
        'Réparer la barrière du lieu',
      );
      const interventionId = new URL(page.url()).pathname.split('/').pop()!;
      await expect(main.locator('.place-summary')).toContainText(place.trim());
      await expect(main.locator('.metadata')).toContainText('Planifiée');
      await expect(main.locator('time')).toHaveText(displayedDate);
      await expect(main.getByRole('link', { name: 'Voir le matériel', exact: true })).toHaveCount(
        0,
      );
      await expect(main).not.toContainText('Matériel introuvable');
      await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
      await expect(page).toHaveURL(sourceUrl);
      await expect(main.locator('.metadata')).toContainText('Ouvert');
      await expect(main.locator('.related-interventions a')).toHaveCount(1);
      await expect(main.locator('.related-interventions')).toContainText(
        'Réparer la barrière du lieu',
      );
      await main.getByRole('link', { name: 'Retour aux signalements', exact: true }).click();
      await expect(main.getByRole('searchbox')).toHaveValue('  ÉCOLES  ');
      await expect(main.getByLabel('Priorité', { exact: true })).toHaveValue('urgent');
      await expect(main.getByLabel('Statut du signalement', { exact: true })).toHaveValue('open');
      await navigate(page, 'Responsable', 'Interventions');
      await main.getByRole('searchbox').fill('ÉCOLES');
      await expect(main.locator('tbody tr')).toHaveCount(1);
      await expect(main.locator('tbody')).toContainText(place.trim());
      await switchSpace(page, 'Agent');
      await navigate(page, 'Agent', 'Interventions');
      await main.getByRole('searchbox').fill('ÉCOLES');
      await expect(main.locator('tbody tr')).toHaveCount(1);
      await main.locator('tbody a').click();
      await expect(page).toHaveURL(
        (url) => url.pathname === `/agent/interventions/${interventionId}`,
      );
      await expect(main.locator('.metadata')).toContainText('Camille Durand');
      await expect(main.locator('.place-summary')).toContainText(place.trim());
      await expect(main.getByRole('link', { name: 'Voir le matériel', exact: true })).toHaveCount(
        0,
      );
      await info.attach('programmation-lieu-consultation-agent', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
      await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
      await expect(main.locator('.related-interventions')).toContainText(
        'Réparer la barrière du lieu',
      );
      await switchSpace(page, 'Responsable');
      await expect(main.locator('[aria-labelledby="dashboard-interventions-title"]')).toContainText(place.trim());
      await navigate(page, 'Responsable', 'Signalements');
      await main.getByRole('searchbox').fill('ÉCOLES');
      await main.locator('tbody a').click();
      await main.getByRole('button', { name: 'Clôturer le signalement', exact: true }).click();
      await main.getByRole('button', { name: 'Clôturer le signalement', exact: true }).click();
      await expect(
        main.getByRole('link', { name: 'Programmer une intervention', exact: true }),
      ).toHaveCount(0);
      // Une navigation Angular vers l'URL directe conserve le signalement de cet onglet.
      await page.evaluate((path) => {
        history.pushState(null, '', path);
        dispatchEvent(new PopStateEvent('popstate'));
      }, `/responsable/interventions/nouvelle/${incidentId}`);
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalement clôturé');
      await expect(main.locator('form')).toHaveCount(0);
      await page.goto('/responsable/interventions/nouvelle/inconnu');
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Signalement introuvable');
      await expect(main.locator('form')).toHaveCount(0);
      expect(writes).toEqual([]);
      expect(errors).toEqual([]);
    });
  });
}
