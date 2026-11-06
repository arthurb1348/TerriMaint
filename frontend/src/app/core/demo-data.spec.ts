import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMO_INCIDENTS } from '../features/incidents/incidents-demo';
import { IncidentPhotos } from '../features/incidents/incident-photos';
import { DEMO_INTERVENTIONS } from '../features/interventions/interventions-demo';
import { DemoData } from './demo-data';

const incidentDraft = (changes: Partial<Parameters<DemoData['createIncident']>[0]> = {}) => ({
  equipmentId: 'EQ-OUT-0001',
  title: 'Moteur à contrôler',
  description: '',
  priority: 'high',
  risk: true,
  photos: [],
  ...changes,
});
const interventionDraft = (
  changes: Partial<Parameters<DemoData['createIntervention']>[0]> = {},
) => ({
  incidentId: 'INC-2026-045',
  title: 'Contrôler le moteur',
  instructions: '',
  agentId: 'AG-DEMO-002',
  plannedOn: '2026-11-07',
  ...changes,
});

describe('Données partagées pendant la vie de l’application', () => {
  let data: DemoData;
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-06T12:00:00Z'));
    let session = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(
      () => `00000000-0000-4000-8000-${String(++session).padStart(12, '0')}`,
    );
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:preparee'),
      revokeObjectURL: vi.fn(),
    });
    TestBed.configureTestingModule({});
    data = TestBed.inject(DemoData);
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('crée des objets reliés, sans altérer les jeux initiaux ni changer les statuts existants', () => {
    const initial = JSON.stringify([DEMO_INCIDENTS, DEMO_INTERVENTIONS]);
    const incident = data.createIncident(incidentDraft())!;
    const intervention = data.createIntervention(interventionDraft({ incidentId: incident.id }))!;
    expect(data.getIncident(incident.id)).toBe(incident);
    expect(incident).toMatchObject({
      status: 'open',
      reportedOn: '2026-11-06',
      equipmentId: 'EQ-OUT-0001',
      risk: true,
    });
    expect(intervention).toMatchObject({
      status: 'planned',
      incidentId: incident.id,
      agentId: 'AG-DEMO-002',
      plannedOn: '2026-11-07',
    });
    expect(data.getIntervention(intervention.id)).toBe(intervention);
    expect(data.incidents()).toHaveLength(DEMO_INCIDENTS.length + 1);
    expect(data.interventions()).toHaveLength(DEMO_INTERVENTIONS.length + 1);
    expect(JSON.stringify([DEMO_INCIDENTS, DEMO_INTERVENTIONS])).toBe(initial);
    expect(data.getIncident('INC-2026-045')).toEqual(DEMO_INCIDENTS[0]);
  });

  it.each([
    { equipmentId: 'absent' },
    { title: '   ' },
    { title: 'x'.repeat(121) },
    { description: 'x'.repeat(2001) },
    { priority: 'toString' },
    { photos: [{ src: 'https://example.test/original', alt: 'original' }] },
    { photos: Array.from({ length: 4 }, () => ({ src: 'blob:trop', alt: 'photo' })) },
  ])('refuse un signalement invalide sans création ni prise de propriété : %j', (changes) => {
    expect(data.createIncident(incidentDraft(changes))).toBeUndefined();
    expect(data.incidents()).toHaveLength(DEMO_INCIDENTS.length);
    TestBed.resetTestingModule();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it.each([
    { incidentId: 'absent' },
    { incidentId: 'INC-2026-049' },
    { agentId: 'absent' },
    { title: '' },
    { title: 'x'.repeat(121) },
    { instructions: 'x'.repeat(2001) },
    { plannedOn: '2026-11-05' },
    { plannedOn: '2026-02-30' },
  ])('refuse une intervention invalide ou sans origine autorisée : %j', (changes) => {
    expect(data.createIntervention(interventionDraft(changes))).toBeUndefined();
    expect(data.interventions()).toHaveLength(DEMO_INTERVENTIONS.length);
  });

  it('préserve les contenus exacts et accepte les champs facultatifs blancs', () => {
    expect(
      data.createIncident(incidentDraft({ title: '  Moteur  ', description: ' '.repeat(2001) })),
    ).toMatchObject({ title: '  Moteur  ', description: undefined });
    expect(
      data.createIntervention(interventionDraft({ instructions: '  Contrôler.\nTester.  ' })),
    ).toMatchObject({ instructions: '  Contrôler.\nTester.  ' });
  });

  it('empêche une modification des collections, objets et photos exposés', () => {
    const photo = { src: 'blob:photo', alt: 'Préparée' };
    const incident = data.createIncident(incidentDraft({ photos: [photo] }))!;
    photo.alt = 'Changement externe';
    expect(incident.photos![0].alt).toBe('Préparée');
    expect(Object.isFrozen(data.incidents())).toBe(true);
    expect(Object.isFrozen(incident)).toBe(true);
    expect(Object.isFrozen(incident.photos)).toBe(true);
    expect(Object.isFrozen(incident.photos![0])).toBe(true);
    expect(Object.isFrozen(data.interventions())).toBe(true);
    expect(data.incidents()).not.toBe(DEMO_INCIDENTS);
  });

  it('génère des identifiants uniques et ne réattribue pas les routes d’une ancienne application', () => {
    const first = data.createIncident(incidentDraft())!;
    const second = data.createIncident(incidentDraft())!;
    const intervention = data.createIntervention(interventionDraft())!;
    expect(
      new Set([...data.incidents(), ...data.interventions()].map((item) => item.id)).size,
    ).toBe(data.incidents().length + data.interventions().length);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const next = TestBed.inject(DemoData);
    expect(next.getIncident(first.id)).toBeUndefined();
    expect(next.getIncident(second.id)).toBeUndefined();
    expect(next.getIntervention(intervention.id)).toBeUndefined();
    expect(next.createIncident(incidentDraft())!.id).not.toBe(first.id);
    expect(next.incidents()).toHaveLength(DEMO_INCIDENTS.length + 1);
  });

  it('ignore une préparation tardive d’un nouveau brouillon sans libérer une photo déjà transférée', async () => {
    const media = new IncidentPhotos(async () => ({
      blob: new Blob(['jpeg']),
      width: 20,
      height: 15,
    }));
    await media.add([new File(['original'], 'acceptee.png')]);
    const incident = data.createIncident(incidentDraft({ photos: media.photos() }))!;
    media.transfer();
    let finish!: (value: { blob: Blob; width: number; height: number }) => void;
    const nextDraft = new IncidentPhotos(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = nextDraft.add([new File(['original'], 'abandonnee.png')]);
    await Promise.resolve();
    nextDraft.clear();
    finish({ blob: new Blob(['tardive']), width: 20, height: 15 });
    await pending;
    expect(nextDraft.photos()).toEqual([]);
    expect(data.getIncident(incident.id)?.photos).toEqual(incident.photos);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('transfère les URL préparées au signalement et les libère une seule fois à la destruction de l’application', async () => {
    const media = new IncidentPhotos(async () => ({
      blob: new Blob(['jpeg']),
      width: 20,
      height: 15,
    }));
    await media.add([new File(['original'], 'photo.png')]);
    const preparedUrl = media.photos()[0].src;
    const incident = data.createIncident(incidentDraft({ photos: media.photos() }))!;
    media.transfer();
    media.clear();
    expect(incident.photos).toEqual([{ src: preparedUrl, alt: 'Photo sélectionnée : photo.png' }]);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    TestBed.resetTestingModule();
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith(preparedUrl);
  });
});
