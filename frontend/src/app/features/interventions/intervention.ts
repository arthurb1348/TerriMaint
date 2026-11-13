export const INTERVENTION_STATUSES = {
  planned: 'Planifiée',
  'in-progress': 'En cours',
  completed: 'Terminée',
} as const;

interface InterventionDetails {
  readonly id: string;
  readonly title: string;
  readonly instructions?: string;
  readonly agentId: string;
  // Date calendaire sans heure, conservée comme telle jusqu'au rendu.
  readonly plannedOn: string;
  readonly status: keyof typeof INTERVENTION_STATUSES;
}

// Une intervention sur lieu garde le signalement comme seule source du lieu.
export type Intervention = InterventionDetails &
  (
    | { readonly equipmentId: string; readonly incidentId?: string }
    | { readonly equipmentId?: never; readonly incidentId: string }
  );
