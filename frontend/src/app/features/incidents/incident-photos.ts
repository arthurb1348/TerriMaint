import { signal } from '@angular/core';
import { preparePhoto } from './photo-preparation';

export interface SelectedPhoto {
  readonly id: number;
  readonly name: string;
  readonly src: string;
  readonly alt: string;
}

// Une instance par brouillon ; après confirmation, DemoData devient propriétaire des URL.
export class IncidentPhotos {
  readonly photos = signal<readonly SelectedPhoto[]>([]);
  readonly errors = signal<readonly string[]>([]);
  readonly busy = signal(false);
  private controller = new AbortController();
  private nextId = 0;
  private queue: Promise<void> = Promise.resolve();
  private readonly pendingFiles = new Set<File[]>();
  private readonly urls = new Set<string>();

  constructor(private readonly prepare = preparePhoto) {}

  add(files: readonly File[]): Promise<void> {
    if (!files.length) return Promise.resolve();
    const signal = this.controller.signal;
    const remaining = [...files];
    this.pendingFiles.add(remaining);
    this.busy.set(true);
    const operation = this.queue.then(async () => {
      if (signal.aborted) return;
      const errors: string[] = [];
      // Shift libère les références aux originaux traités sans attendre toute la sélection.
      while (remaining.length && !signal.aborted) {
        const file = remaining.shift()!;
        if (this.photos().length >= 3) {
          errors.push(`${file.name} : 3 photos maximum.`);
          continue;
        }
        try {
          const prepared = await this.prepare(file, signal);
          if (signal.aborted) break;
          const url = URL.createObjectURL(prepared.blob);
          this.urls.add(url);
          this.photos.update((photos) => [
            ...photos,
            {
              id: ++this.nextId,
              name: file.name,
              src: url,
              alt: `Photo sélectionnée : ${file.name}`,
            },
          ]);
        } catch (error) {
          if (!signal.aborted)
            errors.push(
              `${file.name} : ${error instanceof Error ? error.message : 'préparation impossible'}.`,
            );
        }
      }
      if (!signal.aborted) this.errors.set(errors);
    });
    this.queue = operation.finally(() => {
      this.pendingFiles.delete(remaining);
      if (!signal.aborted && this.queue === completed) this.busy.set(false);
    });
    const completed = this.queue;
    return completed;
  }

  remove(id: number): void {
    const photo = this.photos().find((item) => item.id === id);
    if (photo) this.release(photo.src);
    this.photos.update((photos) => photos.filter((item) => item.id !== id));
  }

  transfer(): void {
    // Appeler après création acceptée : clear annule encore les travaux tardifs,
    // mais ne doit plus révoquer les photos désormais possédées par le signalement.
    this.urls.clear();
    this.clear();
  }

  clear(): void {
    this.controller.abort();
    for (const files of this.pendingFiles) files.length = 0;
    this.pendingFiles.clear();
    this.controller = new AbortController();
    for (const url of this.urls) this.release(url);
    this.photos.set([]);
    this.errors.set([]);
    this.busy.set(false);
    // Garder la file : createImageBitmap/toBlob ne sont pas interrompables. Le
    // nouveau parcours attend leur nettoyage pour ne pas décoder deux gros fichiers.
  }

  private release(url: string): void {
    if (this.urls.delete(url)) URL.revokeObjectURL(url);
  }
}
