import { signal } from '@angular/core';

export const AUDIO_MAX_BYTES = 10 * 1024 * 1024;
export const AUDIO_MAX_SECONDS = 60;
export interface IncidentAudioNote {
  readonly src: string;
  readonly mimeType: string;
  readonly size: number;
  readonly durationSeconds: number;
}

export function validAudioNote(note: IncidentAudioNote): boolean {
  return (
    note.src.startsWith('blob:') &&
    /^audio\/(webm|ogg|mp4)(;|$)/.test(note.mimeType) &&
    Number.isFinite(note.size) &&
    note.size > 0 &&
    note.size <= AUDIO_MAX_BYTES &&
    Number.isFinite(note.durationSeconds) &&
    note.durationSeconds > 0 &&
    note.durationSeconds <= AUDIO_MAX_SECONDS
  );
}

// Vérifie le résultat décodable, sans lecture automatique ni sortie sonore.
export function inspectAudio(src: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    const finish = (error?: Error) => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      audio.onloadeddata = null;
      audio.onerror = null;
      audio.removeAttribute('src');
      audio.load();
      if (error) reject(error);
      else resolve();
    };
    const abort = () => finish(new Error('Capture abandonnée'));
    audio.onloadeddata = () => finish();
    audio.onerror = () => finish(new Error('Note vocale illisible'));
    const timer = setTimeout(() => finish(new Error('Note vocale illisible')), 5000);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }
    audio.preload = 'auto';
    audio.src = src;
    audio.load();
  });
}

// Une instance par brouillon ; DemoData possède l’URL seulement après confirmation.
export class IncidentAudio {
  readonly note = signal<IncidentAudioNote | undefined>(undefined);
  readonly state = signal<'idle' | 'permission' | 'recording' | 'processing'>('idle');
  readonly message = signal('');
  readonly seconds = signal(0);
  private generation = 0;
  private recorder?: MediaRecorder;
  private stream?: MediaStream;
  private timer?: ReturnType<typeof setInterval>;
  private controller = new AbortController();
  private urls = new Set<string>();

  constructor(private readonly inspect = inspectAudio) {}

  async start(stillCurrent: () => boolean = () => true): Promise<void> {
    if (this.state() !== 'idle' || this.note()) return;
    this.message.set('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.message.set(
        'L’enregistrement audio est indisponible dans ce navigateur. Vous pouvez continuer sans note.',
      );
      return;
    }
    const generation = ++this.generation;
    const current = () => generation === this.generation && stillCurrent();
    this.state.set('permission');
    this.message.set('Autorisation du microphone en attente…');
    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (!current()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      if (!stream.getAudioTracks().some((track) => track.readyState === 'live'))
        throw new Error('Microphone indisponible');
      const player = document.createElement('audio');
      const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(
        (type) => MediaRecorder.isTypeSupported(type) && player.canPlayType(type),
      );
      if (!mimeType) throw new Error('Aucun format audio compatible');
      const recorder = new MediaRecorder(stream, { mimeType });
      this.recorder = recorder;
      let chunks: Blob[] = [];
      let size = 0;
      const started = performance.now();
      const fail = (message: string) => {
        if (current()) {
          this.clear();
          this.message.set(message + ' Vous pouvez continuer sans note.');
        }
      };
      recorder.ondataavailable = (event) => {
        if (!current()) return;
        size += event.data.size;
        if (size > AUDIO_MAX_BYTES) {
          chunks = [];
          fail('La note dépasse 10 Mio.');
          return;
        }
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => fail('Erreur pendant l’enregistrement.');
      recorder.onstop = async () => {
        if (!current()) return;
        this.releaseMicrophone();
        this.recorder = undefined;
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        const durationSeconds = Math.min(
          AUDIO_MAX_SECONDS,
          Math.max(0.001, (performance.now() - started) / 1000),
        );
        this.state.set('processing');
        this.message.set('Préparation de la note vocale…');
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType });
          chunks = [];
          if (!blob.size || blob.size > AUDIO_MAX_BYTES) {
            fail('La note vocale est vide ou trop volumineuse.');
            return;
          }
          const src = URL.createObjectURL(blob);
          this.urls.add(src);
          await this.inspect(src, this.controller.signal);
          if (!current()) return;
          const note = { src, mimeType: blob.type, size: blob.size, durationSeconds };
          if (!validAudioNote(note)) throw new Error('Format audio inutilisable');
          this.note.set(Object.freeze(note));
          this.state.set('idle');
          this.message.set('Note vocale prête à être réécoutée.');
        } catch {
          fail('La note vocale est illisible.');
        }
      };
      stream.getTracks().forEach((track) =>
        track.addEventListener(
          'ended',
          () => {
            if (current() && this.state() === 'recording') fail('Le microphone a été interrompu.');
          },
          { once: true },
        ),
      );
      recorder.start(250);
      this.state.set('recording');
      this.seconds.set(0);
      this.message.set('Enregistrement en cours. Le microphone est actif.');
      this.timer = setInterval(() => {
        if (!current() || this.state() !== 'recording') return;
        this.seconds.set(
          Math.min(AUDIO_MAX_SECONDS, Math.floor((performance.now() - started) / 1000)),
        );
        if (performance.now() - started >= AUDIO_MAX_SECONDS * 1000) this.stop();
      }, 250);
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      if (!current()) return;
      this.clear();
      const name = error && typeof error === 'object' && 'name' in error ? error.name : '';
      this.message.set(
        (name === 'NotAllowedError'
          ? 'Accès au microphone refusé.'
          : 'Microphone indisponible ou format audio incompatible.') +
          ' Vous pouvez réessayer ou continuer sans note.',
      );
    }
  }

  stop(): void {
    if (this.state() !== 'recording') return;
    this.state.set('processing');
    try {
      this.recorder?.stop();
    } catch {
      this.clear();
      this.message.set('Erreur à l’arrêt de la capture. Vous pouvez continuer sans note.');
    }
    this.releaseMicrophone();
  }

  transfer(): void {
    this.urls.clear();
    this.clear();
  }

  clear(): void {
    ++this.generation;
    this.controller.abort();
    this.controller = new AbortController();
    const recorder = this.recorder;
    this.recorder = undefined;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      try {
        if (recorder.state !== 'inactive') recorder.stop();
      } catch {
        /* Le nettoyage des pistes reste nécessaire. */
      }
    }
    this.releaseMicrophone();
    for (const src of this.urls) URL.revokeObjectURL(src);
    this.urls.clear();
    this.note.set(undefined);
    this.seconds.set(0);
    this.state.set('idle');
    this.message.set('');
  }

  private releaseMicrophone(): void {
    clearInterval(this.timer);
    this.timer = undefined;
    const stream = this.stream;
    this.stream = undefined;
    stream?.getTracks().forEach((track) => track.stop());
  }
}
