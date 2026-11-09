import { IncidentAudioNote } from './incident-audio';
import { IncidentCoordinates } from './incident-location';
import { DemoImageSource } from '../../shared/demo-image/demo-image';

export const INCIDENT_PRIORITIES = { low: 'Basse', high: 'Haute', urgent: 'Urgente' } as const;
export const INCIDENT_STATUSES = {
  open: 'Ouvert',
  'in-progress': 'En cours',
  closed: 'Clôturé',
} as const;

interface IncidentDetails {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly priority: keyof typeof INCIDENT_PRIORITIES;
  readonly status: keyof typeof INCIDENT_STATUSES;
  // Date calendaire sans heure : forcer UTC dans le rendu pourrait afficher la veille.
  readonly reportedOn: string;
  readonly risk?: boolean;
  readonly audioNote?: IncidentAudioNote;
  readonly coordinates?: IncidentCoordinates;
  readonly photos?: readonly DemoImageSource[];
}

// Un signalement concerne un matériel ou un lieu, jamais les deux à la fois.
export type Incident = IncidentDetails &
  (
    | { readonly equipmentId: string; readonly place?: never }
    | { readonly equipmentId?: never; readonly place: string }
  );

export const INCIDENT_PLACE_LIMIT = 200;
