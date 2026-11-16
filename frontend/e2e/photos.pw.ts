import { expect, test } from '@playwright/test';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const sample = path.resolve('public/images/demo/mower.webp');
for (const space of ['agent', 'responsable']) {
  test(`Photos facultatives, retour et consultation — ${space}`, async ({ page }, info) => {
    await page.route('**/api/v1/health', (route) => route.fulfill({ json: { status: 'ok' } }));
    const requests: string[] = [];
    page.on('request', (request) => { if (!['GET', 'HEAD'].includes(request.method())) requests.push(request.url()); });
    const main = page.getByRole('main');
    await page.goto(`/${space}/equipements`);
    await expect(main.locator('app-demo-image img')).toHaveCount(6);
    for (const image of await main.locator('app-demo-image img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await main.getByRole('link', { name: 'Tondeuse autoportée', exact: true }).click();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Tondeuse autoportée');
    await expect(main.locator('app-demo-image img')).toHaveCount(1);
    await expect(main.locator('app-demo-image img')).toHaveAttribute('alt', /Tondeuse/);
    await main.locator('app-demo-image img').evaluate((img) => img.dispatchEvent(new Event('error')));
    await expect(main).toContainText('Image indisponible');
    await main.getByRole('link', { name: 'Faire un signalement', exact: true }).click();
    await main.getByLabel('Intitulé', { exact: true }).fill('Photo de démonstration');
    await main.getByRole('radio', { name: /Basse/ }).check();
    const chooser = main.locator('#gallery-file');
    const galleryButton = main.getByRole('button', { name: page.viewportSize()!.width < 1200 ? 'Choisir des photos' : 'Ajouter des photos', exact: true });
    await expect(main.locator('#camera-file')).toHaveAttribute('capture', 'environment');
    await expect(chooser).not.toHaveAttribute('capture');
    await expect(chooser).toBeHidden();
    await expect(main.locator('#camera-file')).toBeHidden();
    await chooser.setInputFiles([{ name: 'mower.webp', mimeType: 'image/webp', buffer: readFileSync(sample) }, { name: 'casse.png', mimeType: 'image/png', buffer: Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.from('pas une image')]) }]);
    await expect(main.getByRole('status').and(main.locator('#photos-status'))).toContainText('1 photo(s)');
    await expect(main.locator('#photos-errors')).toContainText('impossible à décoder');
    const preview = main.locator('.photo-gallery img');
    await expect(preview).toHaveCount(1);
    const src = await preview.getAttribute('src');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const verify = main.getByRole('button', { name: 'Vérifier le signalement', exact: true });
    await verify.focus();
    await page.keyboard.press('Enter');
    await expect(preview).toHaveAttribute('src', src!);
    await main.getByRole('button', { name: 'Modifier le signalement', exact: true }).click();
    await expect(preview).toHaveAttribute('src', src!);
    await expect(main.getByLabel('Intitulé', { exact: true })).toHaveValue('Photo de démonstration');
    await main.getByRole('button', { name: /Supprimer la photo mower/ }).focus();
    await page.keyboard.press('Enter');
    await expect(preview).toHaveCount(0);
    await expect(galleryButton).toBeFocused();
    await expect(galleryButton).toBeInViewport({ ratio: 1 });
    if (space === 'agent') {
      const inputBounds = (await galleryButton.boundingBox())!;
      const navBounds = (await page.locator('nav').boundingBox())!;
      expect(inputBounds.y + inputBounds.height + 7).toBeLessThanOrEqual(navBounds.y);
    }
    await info.attach('photos-focus-fenetre', { body: await page.screenshot(), contentType: 'image/png' });
    await chooser.setInputFiles([sample, sample, sample, sample]);
    await expect(preview).toHaveCount(3);
    await expect(main.locator('#photos-errors')).toContainText('3 photos maximum');
    await info.attach('photos-formulaire', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await main.getByRole('link', { name: 'Retour à la fiche matériel', exact: true }).click();
    await page.goto(`/${space}/incidents/nouveau/EQ-OUT-0002`);
    await expect(preview).toHaveCount(0);
    await chooser.setInputFiles(sample);
    await expect(preview).toHaveCount(1);
    await page.reload();
    await expect(preview).toHaveCount(0);
    for (const [id, count] of [['INC-2026-045', 0], ['INC-2026-050', 1], ['INC-2026-047', 2]] as const) {
      await page.goto(`/${space}/incidents/${id}`);
      await expect(main.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(main.locator('.photo-gallery img')).toHaveCount(count);
    }
    await info.attach('photos-exemple', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
    expect(requests).toEqual([]);
    expect(page.url()).not.toContain('blob:');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}
