import { ParamMap } from '@angular/router';
import { DEMO_AGENTS } from './agents-demo';
import { Intervention, INTERVENTION_STATUSES } from './intervention';

export interface InterventionFilters {
  readonly q: string;
  readonly status: Intervention['status'] | '';
  readonly assignee: string;
}

// Liste et détail interprètent l'URL avec les mêmes règles, sans accepter de filtre étranger.
export function readInterventionFilters(params: ParamMap, agentView = false): InterventionFilters {
  const status = params.get('status');
  const assignee = params.get('assignee');
  return {
    q: params.get('q') ?? '',
    status: Object.hasOwn(INTERVENTION_STATUSES, status ?? '')
      ? (status as Intervention['status'])
      : '',
    assignee: !agentView && DEMO_AGENTS.some((agent) => agent.id === assignee) ? assignee! : '',
  };
}

export function interventionQueryParams(filters: InterventionFilters) {
  return {
    q: filters.q || null,
    status: filters.status || null,
    assignee: filters.assignee || null,
  };
}
