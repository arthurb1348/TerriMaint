import { expect, test } from '@playwright/test';

for (const space of ['agent', 'responsable']) {
  test(`Les interventions du matériel conservent le contexte ${space}`, async ({ page }, info) => {
    await page.goto(`/${space}/equipements/EQ-OUT-0001?q=tondeuse`);
    const main = page.getByRole('main');
    const section = main.getByRole('region', { name: 'Interventions', exact: true });
    await expect(section.getByRole('link')).toHaveCount(1);
    const link = section.getByRole('link', { name: /Vérification du plateau de coupe/ });
    await expect(link).toHaveAttribute('href', `/${space}/interventions/INT-2026-035`);
    await expect(section.locator('.badge')).toHaveText('En cours');
    await expect(section).toContainText('Date prévue');
    await expect(main.getByRole('link', { name: 'Retour au matériel' })).toHaveAttribute(
      'href',
      `/${space}/equipements?q=tondeuse`,
    );
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toBeInViewport({ ratio: 1 });
    if (space === 'agent' && page.viewportSize()!.width <= 760) {
      const bounds = await link.boundingBox();
      const navigation = await page.locator('nav').boundingBox();
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(navigation!.y);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    await info.attach('interventions-materiel', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
    await page.keyboard.press('Enter');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(
      'Vérification du plateau de coupe',
    );
    await expect(main.getByRole('link', { name: 'Voir le signalement' })).toHaveAttribute(
      'href',
      `/${space}/incidents/INC-2026-048`,
    );
    await main.getByRole('link', { name: 'Voir le matériel' }).click();
    await expect(section.getByRole('link')).toHaveCount(1);
    await main.getByRole('link', { name: 'Déclarer un incident', exact: true }).click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Déclarer un incident');
    await page.goto(`/${space}/equipements/EQ-OUT-0002`);
    if (space === 'agent') {
      await expect(section.getByRole('link')).toHaveCount(0);
      await expect(section).toContainText(
        'Aucune intervention ne vous est assignée pour ce matériel.',
      );
    } else {
      await expect(section.getByRole('link')).toHaveCount(1);
      await expect(section.locator('.badge')).toHaveText('Terminée');
      await expect(section).toContainText('Date prévue');
      await expect(section).not.toContainText('Date de fin');
    }
    await page.goto(`/${space}/equipements/inconnu`);
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Équipement introuvable');
    await expect(section).toHaveCount(0);
  });
}

test('Programmer puis consulter le matériel retrouve l’intervention en mémoire', async ({
  page,
}, info) => {
  await page.clock.setFixedTime(new Date('2026-11-07T12:00:00Z'));
  await page.goto('/responsable/interventions/nouvelle/INC-2026-045');
  const main = page.getByRole('main');
  await main
    .getByLabel('Titre de l’intervention (obligatoire)', { exact: true })
    .fill('Contrôle matériel depuis la fiche');
  await main
    .getByLabel('Agent à affecter (obligatoire)', { exact: true })
    .selectOption('AG-DEMO-002');
  await main.getByLabel('Date prévue (obligatoire)', { exact: true }).fill('2026-11-08');
  await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
  await main.getByRole('button', { name: 'Programmer l’intervention', exact: true }).click();
  await main.getByRole('link', { name: 'Voir l’intervention', exact: true }).click();
  await expect(page).toHaveURL(/\/responsable\/interventions\/INT-LOCAL-/);
  const interventionUrl = page.url();
  await main.getByRole('link', { name: 'Voir le matériel', exact: true }).click();
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Débroussailleuse n°3');
  const section = main.getByRole('region', { name: 'Interventions', exact: true });
  await expect(section.getByRole('link')).toHaveCount(2);
  const link = section.getByRole('link', { name: /Contrôle matériel depuis la fiche/ });
  await expect(link).toContainText('Planifiée');
  await expect(link).toContainText('Date prévue : 08/11/2026');
  await link.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  await info.attach('intervention-programmee-sur-materiel', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await link.click();
  await expect(page).toHaveURL(interventionUrl);
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Contrôle matériel depuis la fiche',
  );
  await expect(main.getByRole('link', { name: 'Voir le signalement', exact: true })).toBeVisible();
  await page.locator('.space-menu summary').click();
  await page.getByRole('link', { name: 'Espace Agent', exact: true }).click();
  await page.locator('nav').getByRole('link', { name: 'Matériel', exact: true }).click();
  await main.getByRole('link', { name: 'Débroussailleuse n°3', exact: true }).click();
  await expect(section.getByRole('link')).toHaveCount(1);
  await expect(section).not.toContainText('Contrôle matériel depuis la fiche');
  await expect(section).toContainText('Diagnostic et remise en état du système d’alimentation');
});
