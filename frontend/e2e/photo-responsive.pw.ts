import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

for (const space of ['agent', 'responsable'] as const) {
  test(`Actions photo accessibles et données conservées au redimensionnement — ${space}`, async ({
    page,
  }, info) => {
    await page.addInitScript(() => {
      const original = window.createImageBitmap.bind(window);
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      (window as unknown as { releasePhoto: () => void }).releasePhoto = release;
      window.createImageBitmap = (async (...args: Parameters<typeof createImageBitmap>) => {
        await gate;
        return original(...args);
      }) as typeof createImageBitmap;
    });
    await page.goto(`/${space}/incidents/nouveau/EQ-OUT-0001`);
    const main = page.getByRole('main');
    await main.getByLabel('Intitulé', { exact: true }).fill('Photo conservée');
    await main
      .getByLabel('Description (facultative)', { exact: true })
      .fill('Description conservée');
    await main.getByRole('radio', { name: /Basse/ }).check();
    const gallery = main.locator('#incident-photos');
    for (const width of [1199, 1200, 1201, 768]) {
      await page.setViewportSize({ width, height: 1024 });
      await expect(gallery).toHaveAccessibleName(
        width < 1200 ? 'Choisir des photos' : 'Ajouter des photos',
      );
      await expect(
        main.getByRole('button', { name: 'Prendre une photo', exact: true }),
      ).toBeVisible({ visible: width < 1200 });
      await expect(main.locator('#capture-help')).toBeVisible({ visible: width < 1200 });
      await expect(gallery).toHaveAttribute(
        'aria-describedby',
        'photos-help photos-status photos-errors',
      );
    }
    await main
      .locator('#gallery-file')
      .setInputFiles({
        name: 'mower.webp',
        mimeType: 'image/webp',
        buffer: readFileSync('public/images/demo/mower.webp'),
      });
    await expect(main.locator('#photos-status')).toContainText('Préparation');
    await page.setViewportSize({ width: 1200, height: 1024 });
    await expect(main.locator('#photos-status')).toContainText('Préparation');
    await expect(main.getByLabel('Intitulé', { exact: true })).toHaveValue('Photo conservée');
    await page.evaluate(() => (window as unknown as { releasePhoto: () => void }).releasePhoto());
    await expect(main.locator('.photo-gallery img')).toHaveCount(1);
    const src = await main.locator('.photo-gallery img').getAttribute('src');
    for (const width of [1199, 1201, info.project.use.viewport!.width]) {
      await page.setViewportSize({ width, height: info.project.use.viewport!.height });
      await expect(main.locator('.photo-gallery img')).toHaveAttribute('src', src!);
      await expect(main.getByLabel('Description (facultative)', { exact: true })).toHaveValue(
        'Description conservée',
      );
    }
    await gallery.scrollIntoViewIfNeeded();
    await info.attach(`photos-${space}-actions`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
    await main.getByRole('button', { name: 'Vérifier le signalement', exact: true }).click();
    await expect(main).toContainText('Photo conservée');
    await expect(main.locator('.photo-gallery img')).toHaveAttribute('src', src!);
    await page.setViewportSize({ width: 1200, height: 1024 });
    await expect(main.locator('.photo-gallery img')).toHaveAttribute('src', src!);
    await main.getByRole('button', { name: 'Modifier le signalement', exact: true }).click();
    await expect(gallery).toHaveAccessibleName('Ajouter des photos');
    await expect(main.locator('.photo-gallery img')).toHaveAttribute('src', src!);
    await expect(main.getByLabel('Intitulé', { exact: true })).toHaveValue('Photo conservée');
  });
}
