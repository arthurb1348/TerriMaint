import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUDIO_MAX_BYTES, IncidentAudio, inspectAudio, validAudioNote } from './incident-audio';

class Recorder {
  static instances: Recorder[] = [];
  static isTypeSupported = () => true;
  state = 'inactive';
  mimeType = 'audio/webm;codecs=opus';
  ondataavailable?: (event: { data: Blob }) => void;
  onstop?: () => void;
  onerror?: () => void;
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['audio']) });
    this.onstop?.();
  }
  constructor() {
    Recorder.instances.push(this);
  }
}

describe('Note vocale du brouillon', () => {
  let track: {
    stop: ReturnType<typeof vi.fn>;
    readyState: string;
    addEventListener: ReturnType<typeof vi.fn>;
  };
  let stream: MediaStream;
  let capture: ReturnType<typeof vi.fn>;
  let inspect: ReturnType<typeof vi.fn<typeof inspectAudio>>;
  let audio: IncidentAudio;
  beforeEach(() => {
    vi.useFakeTimers();
    track = { stop: vi.fn(), readyState: 'live', addEventListener: vi.fn() };
    stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream;
    capture = vi.fn().mockResolvedValue(stream);
    inspect = vi.fn<typeof inspectAudio>().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: capture } });
    vi.stubGlobal('MediaRecorder', Recorder);
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:audio'), revokeObjectURL: vi.fn() });
    Recorder.instances = [];
    audio = new IncidentAudio(inspect);
  });
  afterEach(() => {
    audio.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('demande au clic, arrête et prépare une note, puis supprime et réenregistre', async () => {
    expect(capture).not.toHaveBeenCalled();
    await audio.start();
    expect(capture).toHaveBeenCalledWith({ audio: true, video: false });
    expect(audio.state()).toBe('recording');
    await audio.start();
    expect(capture).toHaveBeenCalledTimes(1);
    audio.stop();
    await Promise.resolve();
    expect(track.stop).toHaveBeenCalled();
    expect(audio.note()?.mimeType).toBe('audio/webm;codecs=opus');
    audio.clear();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:audio');
    await audio.start();
    expect(capture).toHaveBeenCalledTimes(2);
  });
  it('arrête automatiquement à 60 secondes', async () => {
    await audio.start();
    await vi.advanceTimersByTimeAsync(60000);
    expect(Recorder.instances[0].state).toBe('inactive');
    expect(track.stop).toHaveBeenCalled();
    expect(audio.note()?.durationSeconds).toBe(60);
  });
  it.each(['NotAllowedError', 'NotFoundError', 'NotReadableError'])(
    'gère %s sans garder le micro',
    async (name) => {
      capture.mockRejectedValue(new DOMException('micro', name));
      await audio.start();
      expect(audio.state()).toBe('idle');
      expect(audio.note()).toBeUndefined();
      expect(audio.message()).toContain(name === 'NotAllowedError' ? 'refusé' : 'indisponible');
    },
  );
  it('gère une API absente', async () => {
    vi.stubGlobal('MediaRecorder', undefined);
    await audio.start();
    expect(capture).not.toHaveBeenCalled();
    expect(audio.message()).toContain('indisponible');
  });
  it('refuse un format non pris en charge avant de capturer', async () => {
    vi.spyOn(Recorder, 'isTypeSupported').mockReturnValue(false);
    await audio.start();
    expect(track.stop).toHaveBeenCalled();
    expect(audio.state()).toBe('idle');
    expect(Recorder.instances).toHaveLength(0);
  });
  it('arrête les pistes lors d’une erreur et ignore les anciens événements', async () => {
    await audio.start();
    const oldStop = Recorder.instances[0].onstop!;
    Recorder.instances[0].onerror!();
    oldStop();
    await Promise.resolve();
    expect(track.stop).toHaveBeenCalled();
    expect(audio.note()).toBeUndefined();
  });
  it('refuse une note trop grande puis permet une autre tentative', async () => {
    await audio.start();
    Recorder.instances[0].ondataavailable!({ data: { size: AUDIO_MAX_BYTES + 1 } as Blob });
    expect(audio.message()).toContain('10 Mio');
    expect(track.stop).toHaveBeenCalled();
    await audio.start();
    expect(capture).toHaveBeenCalledTimes(2);
  });
  it('refuse un résultat vide', async () => {
    await audio.start();
    Recorder.instances[0].onstop!();
    expect(audio.message()).toContain('vide');
    expect(audio.note()).toBeUndefined();
    expect(track.stop).toHaveBeenCalled();
  });
  it('refuse le décodage illisible et révoque l’URL', async () => {
    inspect.mockRejectedValue(new Error('illisible'));
    await audio.start();
    audio.stop();
    await Promise.resolve();
    expect(audio.message()).toContain('illisible');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:audio');
  });
  it('arrête un flux obtenu après la sortie du formulaire', async () => {
    let resolve!: (stream: MediaStream) => void;
    capture.mockReturnValue(
      new Promise<MediaStream>((done) => {
        resolve = done;
      }),
    );
    const pending = audio.start();
    audio.clear();
    resolve(stream);
    await pending;
    expect(track.stop).toHaveBeenCalled();
    expect(Recorder.instances).toHaveLength(0);
    expect(audio.note()).toBeUndefined();
  });
  it('ignore une préparation qui termine après nettoyage et transfère une note acceptée', async () => {
    let resolve!: () => void;
    inspect.mockReturnValueOnce(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    await audio.start();
    audio.stop();
    audio.clear();
    resolve();
    await Promise.resolve();
    expect(audio.note()).toBeUndefined();
    await audio.start();
    audio.stop();
    await Promise.resolve();
    vi.mocked(URL.revokeObjectURL).mockClear();
    audio.transfer();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    expect(audio.note()).toBeUndefined();
  });
  it('valide durée, taille et format du champ partagé', () => {
    const note = { src: 'blob:audio', mimeType: 'audio/webm', size: 100, durationSeconds: 1 };
    expect(validAudioNote(note)).toBe(true);
    for (const change of [
      { src: 'https://exemple.test' },
      { size: 0 },
      { size: AUDIO_MAX_BYTES + 1 },
      { durationSeconds: 61 },
      { durationSeconds: NaN },
      { mimeType: 'video/webm' },
    ])
      expect(validAudioNote({ ...note, ...change })).toBe(false);
  });
});
