import { test, expect } from '@playwright/test';

for (const space of ['agent', 'responsable']) {
  test(`Localisation simulée : ajouter, relire, modifier et consulter en ${space}`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 48.25, longitude: -1.5, accuracy: 12 });
    await page.goto(`/${space}/incidents/nouveau/EQ-OUT-0001?q=tondeuse`);
    const main = page.getByRole('main');
    await expect(main).toContainText('Aucune localisation ajoutée.');
    await main.getByRole('button', { name: 'Utiliser ma position', exact: true }).click();
    await expect(main).toContainText('Position obtenue.');
    await expect(main).toContainText('48.25');
    await main.getByLabel('Intitulé', { exact: true }).fill('Localisation simulée');
    await main.getByLabel(/Basse/).check();
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await expect(main).toContainText('48.25');
    await main.getByRole('button', { name: /Modifier/ }).click();
    await expect(main).toContainText('48.25');
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
    await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
    await expect(page).toHaveURL(/\/incidents\/INC-LOCAL-/);
    await expect(main).toContainText('48.25');
    await expect(main).toContainText('Précision : 12 m');
    await expect(
      main.getByRole('link', { name: 'Retour aux signalements', exact: true }),
    ).toHaveAttribute('href', `/${space}/incidents`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test('Refus simulé et API absente permettent un envoi sans localisation', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined }),
  );
  await page.goto('/agent/incidents/nouveau/EQ-OUT-0001');
  const main = page.getByRole('main');
  await main.getByRole('button', { name: 'Utiliser ma position', exact: true }).click();
  await expect(main).toContainText('pas disponible dans ce navigateur');
  await main.getByLabel('Intitulé', { exact: true }).fill('Sans localisation');
  await main.getByLabel(/Basse/).check();
  await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
  await expect(main).toContainText('Aucune localisation ajoutée.');
  await main.getByRole('button', { name: 'Envoyer le signalement', exact: true }).click();
  await main.getByRole('link', { name: 'Voir le signalement', exact: true }).click();
  await expect(main).toContainText('Aucune localisation ajoutée.');
});

test('Retrait et réponses tardives simulées ne réintroduisent pas de position', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const requests: { success: PositionCallback; error?: PositionErrorCallback | null }[] = [];
    Object.assign(window, { locationRequests: requests });
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: PositionCallback, error?: PositionErrorCallback | null) =>
          requests.push({ success, error }),
      },
    });
  });
  await page.goto('/agent/incidents/nouveau/EQ-OUT-0001');
  const main = page.getByRole('main');
  const request = main.getByRole('button', { name: 'Utiliser ma position', exact: true });
  await request.click();
  await expect(main).toContainText('Recherche de votre position');
  await main.getByRole('button', { name: 'Retirer la localisation', exact: true }).click();
  const respond = (index: number, code?: number) =>
    page.evaluate(
      ({ index, code }) => {
        const requests = (
          window as unknown as {
            locationRequests: { success: PositionCallback; error: PositionErrorCallback }[];
          }
        ).locationRequests;
        if (code) requests[index].error({ code } as GeolocationPositionError);
        else
          requests[index].success({
            coords: { latitude: 48.25, longitude: -1.5, accuracy: 12 },
          } as GeolocationPosition);
      },
      { index, code },
    );
  await respond(0);
  await expect(main).toContainText('Aucune localisation ajoutée.');
  await request.click();
  await request.click();
  await respond(1);
  await expect(main).toContainText('Recherche de votre position');
  await respond(2, 1);
  await expect(main).toContainText('refusée');
  await request.click();
  await respond(3, 3);
  await expect(main).toContainText('délai');
  await request.click();
  await respond(4, 2);
  await expect(main).toContainText('indisponible');
  await request.click();
  await main.getByRole('link', { name: 'Annuler', exact: true }).click();
  await respond(5);
  await main.getByRole('link', { name: 'Faire un signalement', exact: true }).click();
  await expect(main).toContainText('Aucune localisation ajoutée.');
});
