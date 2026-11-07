import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { AudioNote } from './audio-note';

describe('Ressources du lecteur de note vocale', () => {
  it('arrête et décharge le lecteur à la suppression puis à la destruction', async () => {
    const fixture = TestBed.createComponent(AudioNote);
    const note = { src: 'blob:note', mimeType: 'audio/webm', size: 100, durationSeconds: 1 };
    fixture.componentRef.setInput('note', note);
    await fixture.whenStable();
    const previous = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
    const pause = vi.spyOn(previous, 'pause');
    const load = vi.spyOn(previous, 'load');
    fixture.componentRef.setInput('note', undefined);
    await fixture.whenStable();
    expect(pause).toHaveBeenCalled();
    expect(load).toHaveBeenCalled();
    expect(previous.getAttribute('src')).toBeNull();
    fixture.componentRef.setInput('note', note);
    await fixture.whenStable();
    const current = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
    const pauseCurrent = vi.spyOn(current, 'pause');
    fixture.destroy();
    expect(pauseCurrent).toHaveBeenCalled();
    expect(current.getAttribute('src')).toBeNull();
  });
});
