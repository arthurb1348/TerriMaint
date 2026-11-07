import { ParamMap } from '@angular/router';
import { Incident, INCIDENT_PRIORITIES, INCIDENT_STATUSES } from './incident';

export interface IncidentFilters {
  readonly q: string;
  readonly priority: Incident['priority'] | '';
  readonly status: Incident['status'] | 'not-closed' | '';
}

// Une URL est une entrée utilisateur : les valeurs inconnues signifient Toutes/Tous.
// La liste et son détail interprètent les trois paramètres avec les mêmes règles.
export function readIncidentFilters(params: ParamMap): IncidentFilters {
  const priority = params.get('priority');
  const status = params.get('status');
  return {
    q: params.get('q') ?? '',
    priority: Object.hasOwn(INCIDENT_PRIORITIES, priority ?? '')
      ? (priority as Incident['priority'])
      : '',
    status:
      status === 'not-closed'
        ? status
        : Object.hasOwn(INCIDENT_STATUSES, status ?? '')
          ? (status as Incident['status'])
          : '',
  };
}

export function incidentQueryParams(filters: IncidentFilters) {
  return {
    q: filters.q || null,
    priority: filters.priority || null,
    status: filters.status || null,
  };
}

export function matchesIncidentFilters(
  incident: Incident,
  filters: Pick<IncidentFilters, 'priority' | 'status'>,
): boolean {
  return (
    (!filters.priority || incident.priority === filters.priority) &&
    (!filters.status ||
      (filters.status === 'not-closed'
        ? incident.status !== 'closed'
        : incident.status === filters.status))
  );
}
