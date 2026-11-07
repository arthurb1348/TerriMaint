export const INTERVENTION_STATUSES = {
  planned: 'Planifiée',
  'in-progress': 'En cours',
  completed: 'Terminée',
} as const;

export interface Intervention {
  readonly id: string;
  readonly title: string;
  readonly instructions?: string;
  readonly equipmentId: string;
  readonly incidentId?: string;
  readonly agentId: string;
  // Date calendaire sans heure, conservée comme telle jusqu'au rendu.
  readonly plannedOn: string;
  readonly status: keyof typeof INTERVENTION_STATUSES;
}
