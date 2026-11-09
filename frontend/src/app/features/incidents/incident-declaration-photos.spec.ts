import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, it } from 'vitest';
import { routes } from '../../app.routes';
import { IncidentDeclaration } from './incident-declaration';
import { IncidentPhotos } from './incident-photos';

describe('Association des photos au parcours', () => {
  it('conserve q, efface au changement de matériel puis au départ', async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/agent/incidents/nouveau/EQ-OUT-0001', IncidentDeclaration);
    const component = harness.routeDebugElement!.componentInstance;
    const media = (component as { media: IncidentPhotos }).media;
    media.photos.set([{ id: 1, name: 'photo.png', src: 'blob:test', alt: 'Photo sélectionnée' }]);
    await harness.navigateByUrl(
      '/agent/incidents/nouveau/EQ-OUT-0001?q=tondeuse',
      IncidentDeclaration,
    );
    expect(media.photos()).toHaveLength(1);
    await harness.navigateByUrl('/agent/incidents/nouveau/EQ-OUT-0002', IncidentDeclaration);
    expect(harness.routeDebugElement!.componentInstance).toBe(component);
    expect(media.photos()).toHaveLength(0);
    media.photos.set([{ id: 2, name: 'autre.png', src: 'blob:autre', alt: 'Autre photo' }]);
    await harness.navigateByUrl('/agent/equipements');
    expect(media.photos()).toHaveLength(0);
    harness.fixture.destroy();
  });
});

describe('Préparation en cours dans le formulaire', () => {
  it('bloque la double validation puis ignore le résultat après changement de matériel', async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/responsable/incidents/nouveau/EQ-OUT-0001', IncidentDeclaration);
    const component = harness.routeDebugElement!.componentInstance as unknown as {
      media: IncidentPhotos;
      review(): void;
      step(): string;
      form: {
        setValue(value: {
          place: string;
          title: string;
          description: string;
          priority: string;
          risk: boolean;
        }): void;
      };
    };
    let finish!: (value: import('./photo-preparation').PreparedPhoto) => void;
    const media = new IncidentPhotos(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    Object.defineProperty(component, 'media', { value: media });
    component.form.setValue({ place: '', title: 'Fissure', description: '', priority: 'low', risk: false });
    const task = media.add([new File(['x'], 'photo.png')]);
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    component.review();
    component.review();
    expect(component.step()).toBe('form');
    await harness.navigateByUrl('/responsable/incidents/nouveau/EQ-OUT-0002', IncidentDeclaration);
    finish({ blob: new Blob(['préparée']), width: 10, height: 10 });
    await task;
    expect(media.photos()).toHaveLength(0);
    expect(media.busy()).toBe(false);
    expect(component.step()).toBe('form');
    harness.fixture.destroy();
  });
});
