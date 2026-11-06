import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Images fabriquées par le vrai canvas Chromium, puis réencodées par le parcours.
// Le bruit déterministe dépasse réellement 5 Mio, sans padding de faux fichier.
async function imageFile(page: Page, width: number, height: number, type: string, noise = false) {
  const base64 = await page.evaluate(
    ({ width, height, type, noise }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d')!;
      if (noise) {
        const data = context.createImageData(width, height);
        let seed = 57;
        for (let i = 0; i < data.data.length; i += 4) {
          for (let channel = 0; channel < 3; channel++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            data.data[i + channel] = seed >>> 24;
          }
          data.data[i + 3] = 255;
        }
        context.putImageData(data, 0, 0);
      } else {
        for (const [x, y, color] of [
          [0, 0, '#f00000'],
          [width / 2, 0, '#0000f0'],
          [0, height / 2, '#00c000'],
          [width / 2, height / 2, '#f0e000'],
        ] as const) {
          context.fillStyle = color;
          context.fillRect(x, y, width / 2, height / 2);
        }
      }
      const result = canvas.toDataURL(type, 0.95).split(',')[1];
      canvas.width = canvas.height = 0;
      return result;
    },
    { width, height, type, noise },
  );
  return {
    name: `test.${type.split('/')[1]}`,
    mimeType: type,
    buffer: Buffer.from(base64, 'base64'),
  };
}

function orientedJpeg(buffer: Buffer, orientation: number) {
  // APP1 EXIF : TIFF little endian, une entrée Orientation ; pixels inchangés.
  const exif = Buffer.from([
    0xff,
    0xe1,
    0,
    34,
    69,
    120,
    105,
    102,
    0,
    0,
    73,
    73,
    42,
    0,
    8,
    0,
    0,
    0,
    1,
    0,
    18,
    1,
    3,
    0,
    1,
    0,
    0,
    0,
    orientation,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ]);
  return Buffer.concat([buffer.subarray(0, 2), exif, buffer.subarray(2)]);
}

async function output(page: Page) {
  return page
    .locator('.photo-gallery img')
    .first()
    .evaluate(async (element) => {
      const blob = await (await fetch((element as HTMLImageElement).src)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      const colors = [
        [0.25, 0.25],
        [0.75, 0.25],
        [0.25, 0.75],
        [0.75, 0.75],
      ].map(([x, y]) =>
        Array.from(
          context.getImageData(Math.floor(canvas.width * x), Math.floor(canvas.height * y), 1, 1)
            .data,
        ).slice(0, 3),
      );
      const result = {
        width: canvas.width,
        height: canvas.height,
        bytes: blob.size,
        type: blob.type,
        colors,
      };
      canvas.width = canvas.height = 0;
      return result;
    });
}

for (const space of ['agent', 'responsable']) {
  test(`Préparation réelle, dimensions et pixels orientés — ${space}`, async ({ page }, info) => {
    await page.goto(`/${space}/incidents/nouveau/EQ-OUT-0001`);
    const chooser = page.locator('#gallery-file');
    const preview = page.locator('.photo-gallery img');
    const normal = await imageFile(page, 120, 80, 'image/jpeg');
    // Ordre des quadrants attendu pour les huit orientations, miroir compris.
    const quadrants = [
      [0, 1, 2, 3],
      [1, 0, 3, 2],
      [3, 2, 1, 0],
      [2, 3, 0, 1],
      [0, 2, 1, 3],
      [2, 0, 3, 1],
      [3, 1, 2, 0],
      [1, 3, 0, 2],
    ];
    const palette = [
      [240, 0, 0],
      [0, 0, 240],
      [0, 192, 0],
      [240, 224, 0],
    ];
    const measures: unknown[] = [];
    for (let orientation = 1; orientation <= 8; orientation++) {
      const oriented = orientedJpeg(normal.buffer, orientation);
      await chooser.setInputFiles({ ...normal, buffer: oriented });
      await expect(page.locator('#photos-status')).toContainText('1 photo(s)');
      const actual = await output(page);
      expect([actual.width, actual.height]).toEqual(orientation >= 5 ? [80, 120] : [120, 80]);
      expect(actual.type).toBe('image/jpeg');
      expect(actual.bytes).toBeLessThanOrEqual(1.5 * 1024 * 1024);
      for (let quadrant = 0; quadrant < 4; quadrant++) {
        actual.colors[quadrant].forEach((value, channel) =>
          expect(
            Math.abs(value - palette[quadrants[orientation - 1][quadrant]][channel]),
          ).toBeLessThan(20),
        );
      }
      measures.push({ orientation, before: oriented.length, ...actual });
      await page.getByRole('button', { name: /Supprimer la photo/ }).click();
      // L’URL est révoquée immédiatement ; attendre aussi le rendu Angular pour
      // ne pas mesurer l’ancien <img> avant que la prochaine photo soit affichée.
      await expect(preview).toHaveCount(0);
    }
    for (const file of [
      await imageFile(page, 160, 80, 'image/png'),
      {
        name: 'mower.webp',
        mimeType: 'image/webp',
        buffer: readFileSync('public/images/demo/mower.webp'),
      },
      await imageFile(page, 4000, 3000, 'image/jpeg'),
    ]) {
      await chooser.setInputFiles(file);
      await expect(preview).toHaveCount(1);
      await expect(page.locator('#photos-status')).toContainText('1 photo(s)');
      const actual = await output(page);
      expect([actual.width, actual.height]).toEqual(
        file.mimeType === 'image/png'
          ? [160, 80]
          : file.mimeType === 'image/webp'
            ? [900, 675]
            : [1920, 1440],
      );
      expect(actual.type).toBe('image/jpeg');
      expect(actual.bytes).toBeLessThanOrEqual(1.5 * 1024 * 1024);
      measures.push({ name: file.name, before: file.buffer.length, ...actual });
      await page.getByRole('button', { name: /Supprimer la photo/ }).click();
      // L’URL est révoquée immédiatement ; attendre aussi le rendu Angular pour
      // ne pas mesurer l’ancien <img> avant que la prochaine photo soit affichée.
      await expect(preview).toHaveCount(0);
    }
    const large = await imageFile(page, 1600, 1200, 'image/png', true);
    expect(large.buffer.length).toBeGreaterThan(5 * 1024 * 1024);
    const started = Date.now();
    await chooser.setInputFiles(large);
    await expect(page.locator('#photos-status')).toContainText('1 photo(s)');
    const actual = await output(page);
    expect([actual.width, actual.height]).toEqual([1600, 1200]);
    expect(actual.bytes).toBeLessThanOrEqual(1.5 * 1024 * 1024);
    expect(actual.type).toBe('image/jpeg');
    measures.push({
      name: 'bruit-1600x1200.png',
      before: large.buffer.length,
      elapsedAutomationMs: Date.now() - started,
      ...actual,
    });
    await info.attach('mesures-preparation-reelle', {
      body: JSON.stringify(measures, null, 2),
      contentType: 'application/json',
    });
    await info.attach('photo-preparee', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

  test(`Annulation des sélecteurs natifs et erreurs sans perte — ${space}`, async ({ page }) => {
    await page.goto(`/${space}/incidents/nouveau/EQ-OUT-0001`);
    await page.getByLabel('Intitulé', { exact: true }).fill('Fissure à examiner');
    const file = await imageFile(page, 120, 80, 'image/png');
    await page.locator('#gallery-file').setInputFiles(file);
    await expect(page.locator('.photo-gallery img')).toHaveCount(1);
    const src = await page.locator('.photo-gallery img').getAttribute('src');
    for (const name of page.viewportSize()!.width < 1200
      ? ['Prendre une photo', 'Choisir des photos']
      : ['Ajouter des photos']) {
      const chooserEvent = page.waitForEvent('filechooser');
      await page.getByRole('button', { name, exact: true }).click();
      const chooser = await chooserEvent;
      expect(chooser.isMultiple()).toBe(name !== 'Prendre une photo');
      await chooser.setFiles([]);
      await expect(page.locator('.photo-gallery img')).toHaveAttribute('src', src!);
      await expect(page.getByLabel('Intitulé', { exact: true })).toHaveValue('Fissure à examiner');
    }
    await page
      .locator('#gallery-file')
      .setInputFiles({ ...file, name: 'tronquee.png', buffer: file.buffer.subarray(0, 40) });
    await expect(page.locator('#photos-errors')).toContainText(
      'impossible à décoder sur ce navigateur',
    );
    await expect(page.locator('.photo-gallery img')).toHaveCount(1);
    const giant = Buffer.alloc(32);
    giant.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
    giant.writeUInt32BE(8193, 16);
    giant.writeUInt32BE(1, 20);
    await page
      .locator('#gallery-file')
      .setInputFiles([{ name: 'trop-grande.png', mimeType: 'image/png', buffer: giant }, file]);
    await expect(page.locator('.photo-gallery img')).toHaveCount(2);
    await expect(page.locator('#photos-errors')).toContainText('image trop grande');
    await expect(page.getByLabel('Intitulé', { exact: true })).toHaveValue('Fissure à examiner');
    await page.getByRole('link', { name: 'Annuler', exact: true }).click();
    await page.goto(`/${space}/incidents/nouveau/EQ-OUT-0002`);
    await expect(page.locator('.photo-gallery img')).toHaveCount(0);
  });
}
