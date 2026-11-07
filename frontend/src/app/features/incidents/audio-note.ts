import { Component, DestroyRef, ElementRef, effect, inject, input, signal } from '@angular/core';
import { IncidentAudioNote } from './incident-audio';

@Component({
  selector: 'app-audio-note',
  template: `@if (note(); as value) {
      <audio
        controls
        preload="metadata"
        [src]="value.src"
        aria-label="Note vocale du signalement"
        (error)="unreadable.set(true)"
      ></audio>
      @if (unreadable()) {
        <p>Cette note vocale ne peut pas être lue dans ce navigateur.</p>
      }
    } @else {
      <p>Aucune note vocale ajoutée.</p>
    }`,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    audio {
      display: block;
      width: 100%;
      max-width: 360px;
    }
  `,
})
export class AudioNote {
  readonly note = input<IncidentAudioNote>();
  protected readonly unreadable = signal(false);
  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    effect(() => {
      this.note();
      this.unreadable.set(false);
    });
    inject(DestroyRef).onDestroy(() => {
      const audio = host.nativeElement.querySelector('audio');
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
    });
  }
}
