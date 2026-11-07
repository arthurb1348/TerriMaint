import { IncidentCoordinates } from './incident-location';
import { DemoImageSource } from '../../shared/demo-image/demo-image';

export const INCIDENT_PRIORITIES = { low: 'Basse', high: 'Haute', urgent: 'Urgente' } as const;
export const INCIDENT_STATUSES = {
  open: 'Ouvert',
  'in-progress': 'En cours',
  closed: 'Clôturé',
} as const;

export interface Incident {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly equipmentId: string;
  readonly priority: keyof typeof INCIDENT_PRIORITIES;
  readonly status: keyof typeof INCIDENT_STATUSES;
  // Date calendaire sans heure : forcer UTC dans le rendu pourrait afficher la veille.
  readonly reportedOn: string;
  readonly risk?: boolean;
  readonly coordinates?: IncidentCoordinates;
  readonly photos?: readonly DemoImageSource[];
}
