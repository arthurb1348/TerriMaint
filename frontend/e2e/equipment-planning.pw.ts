import { test, expect } from '@playwright/test';

test('Programmer un entretien depuis le matériel conserve origine, affectation et historique', async ({ page }) => {
  await page.goto('/responsable/equipements/EQ-OUT-0001?q=tondeuse');
  const main = page.getByRole('main');
  await main.getByRole('link', { name: 'Programmer une intervention', exact: true }).click();
  await expect(main).toContainText('EQ-OUT-0001');
  await main.getByLabel('Titre de l’intervention (obligatoire)', { exact: true }).fill('Entretien préventif');
  await main.getByLabel('Agent à affecter (obligatoire)', { exact: true }).selectOption('AG-DEMO-001');
  await main.getByLabel('Date prévue (obligatoire)', { exact: true }).fill('2099-11-08');
  await main.getByRole('button', { name: 'Vérifier l’intervention', exact: true }).click();
  await main.getByRole('button', { name: 'Programmer l’intervention', exact: true }).click();
  const back = main.getByRole('link', { name: 'Retour au matériel', exact: true });
  await expect(back).toHaveAttribute('href', '/responsable/equipements/EQ-OUT-0001?q=tondeuse');
  await main.getByRole('link', { name: 'Voir l’intervention', exact: true }).click();
  await expect(main).toContainText('EQ-OUT-0001');
  await expect(main.getByRole('heading', { name: 'Signalement d’origine', exact: true })).toHaveCount(0);
  await expect(main.getByRole('link', { name: 'Retour au matériel', exact: true })).toHaveAttribute('href', '/responsable/equipements/EQ-OUT-0001?q=tondeuse');
  const id = new URL(page.url()).pathname.split('/').pop()!;
  await main.getByRole('link', { name: 'Voir le matériel', exact: true }).click();
  await expect(main.getByRole('link', { name: /Entretien préventif/ })).toContainText('Planifiée');
  const nav = async (space: string, label: string) => {
    await page.locator('.space-menu summary').click();
    await page.getByRole('link', { name: `Espace ${space}`, exact: true }).click();
    if (page.viewportSize()!.width <= 760 && space === 'Responsable') await page.getByRole('button', { name: /Ouvrir.*navigation/ }).click();
    await page.locator('nav').getByRole('link', { name: label, exact: true }).click();
  };
  await nav('Agent', 'Interventions');
  await expect(main.getByRole('link', { name: /Entretien préventif/ })).toBeVisible();
  await nav('Responsable', 'Interventions');
  await expect(main.getByRole('link', { name: /Entretien préventif/ })).toBeVisible();
  await main.getByRole('link', { name: /Entretien préventif/ }).click();
  await expect(page).toHaveURL(new RegExp(id));
  if (page.viewportSize()!.width <= 760) await page.getByRole('button', { name: 'Ouvrir la navigation', exact: true }).click();
  await page.locator('nav').getByRole('link', { name: 'Signalements', exact: true }).click();
  await main.getByRole('link', { name: /INC-2026-048/ }).click();
  const related = main.getByRole('region', { name: 'Interventions liées', exact: true });
  await expect(related.getByRole('link')).toHaveCount(1);
  await expect(related).not.toContainText('Entretien préventif');

});

test('La programmation refuse un matériel inconnu et un signalement clôturé en accès direct', async ({ page }) => {
  await page.goto('/responsable/interventions/materiel/inconnu');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Matériel introuvable');
  await expect(page.getByRole('button', { name: 'Vérifier l’intervention', exact: true })).toHaveCount(0);
  await page.goto('/responsable/interventions/nouvelle/INC-2026-049');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Signalement clôturé');
  await expect(page.getByRole('button', { name: 'Vérifier l’intervention', exact: true })).toHaveCount(0);
});
