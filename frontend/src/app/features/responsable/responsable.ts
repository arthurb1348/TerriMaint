import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DemoData } from '../../core/demo-data';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { INCIDENT_PRIORITIES, INCIDENT_STATUSES } from '../incidents/incident';
import {
  IncidentFilters,
  incidentQueryParams,
  matchesIncidentFilters,
} from '../incidents/incident-filters';
import { INTERVENTION_STATUSES } from '../interventions/intervention';
import { interventionQueryParams } from '../interventions/intervention-filters';

const INCIDENT_INDICATORS: readonly { label: string; filters: IncidentFilters }[] = [
  { label: 'Signalements ouverts', filters: { q: '', priority: '', status: 'open' } },
  {
    label: 'Signalements urgents non clôturés',
    filters: { q: '', priority: 'urgent', status: 'not-closed' },
  },
];
const PRIORITY_ORDER = { urgent: 0, high: 1, low: 2 } as const;
function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

@Component({
  selector: 'app-responsable',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './responsable.html',
  styleUrls: ['../incidents/incident-presentation.css', './responsable.css'],
})
export class Responsable {
  private readonly data = inject(DemoData);
  protected readonly priorities = INCIDENT_PRIORITIES;
  protected readonly incidentStatuses = INCIDENT_STATUSES;
  protected readonly interventionStatuses = INTERVENTION_STATUSES;
  protected readonly indicators = computed(() => [
    ...INCIDENT_INDICATORS.map(({ label, filters }) => ({
      label,
      urgent: filters.priority === 'urgent',
      count: this.data.incidents().filter((item) => matchesIncidentFilters(item, filters)).length,
      path: '/responsable/incidents',
      query: incidentQueryParams(filters),
    })),
    {
      label: 'Interventions planifiées',
      urgent: false,
      count: this.data.interventions().filter((item) => item.status === 'planned').length,
      path: '/responsable/interventions',
      query: interventionQueryParams({ q: '', status: 'planned', assignee: '' }),
    },
  ]);
  protected readonly incidentPreview = computed(() =>
    this.data
      .incidents()
      .filter((item) => item.status !== 'closed')
      .sort(
        (left, right) =>
          PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority] ||
          compareText(right.reportedOn, left.reportedOn) ||
          compareText(left.id, right.id),
      )
      .slice(0, 3),
  );
  protected readonly interventionPreview = computed(() =>
    this.data
      .interventions()
      .filter((item) => item.status === 'planned')
      .sort(
        (left, right) =>
          compareText(left.plannedOn, right.plannedOn) || compareText(left.id, right.id),
      )
      .slice(0, 3),
  );

  protected equipmentName(id: string): string {
    return DEMO_EQUIPMENT.find((item) => item.id === id)?.name ?? 'Matériel introuvable';
  }
}
