import { Component, ElementRef, effect, input, signal, viewChild } from '@angular/core';
import { IncidentAudioNote } from './incident-audio';

@Component({
  selector: 'app-audio-note',
  template: `@if (note(); as value) {
      <audio
        #player
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
  private readonly player = viewChild<ElementRef<HTMLAudioElement>>('player');
  protected readonly unreadable = signal(false);
  constructor() {
    effect(() => {
      this.note();
      this.unreadable.set(false);
    });
    effect((onCleanup) => {
      const audio = this.player()?.nativeElement;
      if (!audio) return;
      onCleanup(() => {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      });
    });
  }
}
