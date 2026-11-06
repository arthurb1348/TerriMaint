import { DemoData } from '../../core/demo-data';
import { DatePipe, DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { INCIDENT_PRIORITIES, INCIDENT_STATUSES } from './incident';
import { incidentQueryParams, readIncidentFilters } from './incident-filters';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './incidents.html',
  styleUrls: ['./incident-presentation.css', './incidents.css'],
})
export class Incidents {
  private readonly data = inject(DemoData);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly filters = computed(() => readIncidentFilters(this.queryParams()));
  protected readonly query = computed(() => incidentQueryParams(this.filters()));
  protected readonly priorities = INCIDENT_PRIORITIES;
  protected readonly statuses = INCIDENT_STATUSES;
  protected readonly priorityOptions = Object.entries(INCIDENT_PRIORITIES);
  protected readonly statusOptions = Object.entries(INCIDENT_STATUSES);
  private readonly rows = computed(() =>
    this.data.incidents().map((incident) => ({
      incident,
      equipment: DEMO_EQUIPMENT.find((equipment) => equipment.id === incident.equipmentId),
    })),
  );
  protected readonly filteredIncidents = computed(() => {
    const { q, priority, status } = this.filters();
    const search = q.trim().toLowerCase();
    return this.rows().filter(
      ({ incident, equipment }) =>
        (!priority || incident.priority === priority) &&
        (!status || incident.status === status) &&
        [incident.id, incident.title, incident.equipmentId, equipment?.name ?? ''].some((value) =>
          value.toLowerCase().includes(search),
        ),
    );
  });

  constructor() {
    afterNextRender(() => this.document.getElementById('main-content')?.focus());
  }

  protected updateFilter(name: 'q' | 'priority' | 'status', value: string): void {
    // Garder une seule entrée d'historique pour la saisie et ses filtres combinés.
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...this.query(), [name]: value || null },
      replaceUrl: true,
    });
  }

  protected async resetFilters(input: HTMLInputElement): Promise<void> {
    await this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    input.focus();
  }
}
