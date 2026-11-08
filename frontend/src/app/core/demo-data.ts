import { IncidentAudioNote, validAudioNote } from '../features/incidents/incident-audio';
import { IncidentCoordinates, validCoordinates } from '../features/incidents/incident-location';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { DEMO_EQUIPMENT } from '../features/equipements/equipements-demo';
import {
  Incident,
  INCIDENT_PLACE_LIMIT,
  INCIDENT_PRIORITIES,
} from '../features/incidents/incident';
import { DEMO_INCIDENTS } from '../features/incidents/incidents-demo';
import { DEMO_AGENTS } from '../features/interventions/agents-demo';
import { Intervention } from '../features/interventions/intervention';
import { DEMO_INTERVENTIONS } from '../features/interventions/interventions-demo';
import { localToday, plannedDateErrors } from '../features/interventions/planning-date';
import { PRESENTED_AGENT } from './presented-agent';
import { DemoImageSource } from '../shared/demo-image/demo-image';

interface IncidentDraft {
  readonly audioNote?: IncidentAudioNote;
  readonly coordinates?: IncidentCoordinates;
  readonly equipmentId?: string;
  readonly place?: string;
  readonly title: string;
  readonly description: string;
  readonly priority: string;
  readonly risk: boolean;
  readonly photos: readonly DemoImageSource[];
}

interface InterventionDraft {
  readonly equipmentId?: string;
  readonly incidentId?: string;
  readonly title: string;
  readonly instructions: string;
  readonly agentId: string;
  readonly plannedOn: string;
}

function freezeIncident(incident: Incident): Incident {
  return Object.freeze({
    ...incident,
    audioNote: incident.audioNote && Object.freeze({ ...incident.audioNote }),
    coordinates: incident.coordinates && Object.freeze({ ...incident.coordinates }),
    photos:
      incident.photos && Object.freeze(incident.photos.map((photo) => Object.freeze({ ...photo }))),
  });
}

@Injectable({ providedIn: 'root' })
export class DemoData {
  private readonly incidentState = signal<readonly Incident[]>(
    Object.freeze(DEMO_INCIDENTS.map(freezeIncident)),
  );
  private readonly interventionState = signal<readonly Intervention[]>(
    Object.freeze(DEMO_INTERVENTIONS.map((item) => Object.freeze({ ...item }))),
  );
  readonly incidents = this.incidentState.asReadonly();
  readonly interventions = this.interventionState.asReadonly();
  // Un compteur seul réattribuerait les anciennes routes après un rechargement.
  private readonly sessionId = crypto.randomUUID();
  private incidentSequence = 0;
  private interventionSequence = 0;
  private readonly mediaUrls = new Set<string>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const url of this.mediaUrls) URL.revokeObjectURL(url);
      this.mediaUrls.clear();
    });
  }

  getIncident(id: string | null | undefined): Incident | undefined {
    return this.incidents().find((item) => item.id === id);
  }

  getIntervention(id: string | null | undefined): Intervention | undefined {
    return this.interventions().find((item) => item.id === id);
  }

  closeIncident(id: string | null | undefined): boolean {
    let closed = false;
    this.incidentState.update((items) => {
      const incident = items.find((item) => item.id === id);
      if (!incident || (incident.status !== 'open' && incident.status !== 'in-progress'))
        return items;
      closed = true;
      return Object.freeze(
        items.map((item) =>
          item === incident ? Object.freeze({ ...item, status: 'closed' as const }) : item,
        ),
      );
    });
    return closed;
  }

  completeAssignedIntervention(id: string | null | undefined): boolean {
    let completed = false;
    this.interventionState.update((items) => {
      const intervention = items.find((item) => item.id === id);
      if (
        !intervention ||
        intervention.agentId !== PRESENTED_AGENT.id ||
        intervention.status !== 'in-progress'
      )
        return items;

      completed = true;
      return Object.freeze(
        items.map((item) =>
          item === intervention ? Object.freeze({ ...item, status: 'completed' as const }) : item,
        ),
      );
    });
    return completed;
  }

  createIncident(draft: IncidentDraft): Incident | undefined {
    const onEquipment = draft.equipmentId !== undefined;
    if (
      (onEquipment
        ? !DEMO_EQUIPMENT.some((item) => item.id === draft.equipmentId) || draft.place !== undefined
        : !draft.place?.trim() || draft.place.length > INCIDENT_PLACE_LIMIT) ||
      !draft.title.trim() ||
      draft.title.length > 120 ||
      (draft.description.trim() && draft.description.length > 2000) ||
      !Object.hasOwn(INCIDENT_PRIORITIES, draft.priority) ||
      (draft.coordinates !== undefined && !validCoordinates(draft.coordinates)) ||
      (draft.audioNote !== undefined && !validAudioNote(draft.audioNote)) ||
      draft.photos.length > 3 ||
      draft.photos.some((photo) => !photo.src.startsWith('blob:') || !photo.alt.trim())
    )
      return undefined;

    const incident = freezeIncident({
      id: `INC-LOCAL-${this.sessionId}-${++this.incidentSequence}`,
      ...(onEquipment ? { equipmentId: draft.equipmentId! } : { place: draft.place! }),
      title: draft.title,
      description: draft.description.trim() ? draft.description : undefined,
      priority: draft.priority as Incident['priority'],
      risk: draft.risk,
      status: 'open',
      reportedOn: localToday(),
      coordinates: draft.coordinates,
      audioNote: draft.audioNote,
      photos: draft.photos.map(({ src, alt }) => ({ src, alt })),
    });
    // La création acceptée prend possession des seules URL préparées, sans réencoder.
    for (const photo of incident.photos ?? []) this.mediaUrls.add(photo.src);
    if (incident.audioNote) this.mediaUrls.add(incident.audioNote.src);
    this.incidentState.update((items) => Object.freeze([...items, incident]));
    return incident;
  }

  createIntervention(draft: InterventionDraft): Intervention | undefined {
    const incident = this.getIncident(draft.incidentId);
    const equipmentId = incident?.equipmentId ?? draft.equipmentId;
    if (
      (draft.incidentId !== undefined &&
        (!incident || !incident.equipmentId || incident.status === 'closed')) ||
      (incident && draft.equipmentId !== undefined && draft.equipmentId !== incident.equipmentId) ||
      !DEMO_EQUIPMENT.some((item) => item.id === equipmentId) ||
      !DEMO_AGENTS.some((item) => item.id === draft.agentId) ||
      !draft.title.trim() ||
      draft.title.length > 120 ||
      (draft.instructions.trim() && draft.instructions.length > 2000) ||
      plannedDateErrors(draft.plannedOn)
    )
      return undefined;

    const intervention: Intervention = Object.freeze({
      id: `INT-LOCAL-${this.sessionId}-${++this.interventionSequence}`,
      equipmentId: equipmentId!,
      ...(incident ? { incidentId: incident.id } : {}),
      title: draft.title,
      instructions: draft.instructions.trim() ? draft.instructions : undefined,
      agentId: draft.agentId,
      plannedOn: draft.plannedOn,
      status: 'planned',
    });
    this.interventionState.update((items) => Object.freeze([...items, intervention]));
    return intervention;
  }
}
