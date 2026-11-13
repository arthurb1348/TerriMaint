import { PRESENTED_AGENT } from '../../core/presented-agent';
import { assignedInterventions } from './assigned-interventions';
import { DemoData } from '../../core/demo-data';
import { DatePipe, DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { DEMO_AGENTS } from './agents-demo';
import { INTERVENTION_STATUSES } from './intervention';
import {
  InterventionFilters,
  interventionQueryParams,
  readInterventionFilters,
} from './intervention-filters';

@Component({
  selector: 'app-interventions',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './interventions.html',
  styleUrls: ['../incidents/incident-presentation.css', './interventions.css'],
})
export class Interventions {
  private readonly data = inject(DemoData);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly agentView = this.route.snapshot.data['agentView'] === true;
  protected readonly presentedAgent = PRESENTED_AGENT;
  private readonly scopedInterventions = computed(() =>
    this.agentView ? assignedInterventions(this.data.interventions()) : this.data.interventions(),
  );
  protected readonly filters = computed(() =>
    readInterventionFilters(this.queryParams(), this.agentView),
  );
  protected readonly query = computed(() => interventionQueryParams(this.filters()));
  protected readonly statuses = INTERVENTION_STATUSES;
  protected readonly statusOptions = Object.entries(INTERVENTION_STATUSES);
  protected readonly agents = DEMO_AGENTS;
  protected readonly total = computed(() => this.scopedInterventions().length);
  protected readonly counts = computed(() =>
    this.statusOptions.map(([status, label]) => ({
      status,
      label,
      count: this.scopedInterventions().filter((item) => item.status === status).length,
    })),
  );
  private readonly rows = computed(() =>
    this.scopedInterventions().map((intervention) => {
      return {
        intervention,
        equipment: DEMO_EQUIPMENT.find((item) => item.id === intervention.equipmentId),
        place: this.data.getIncident(intervention.incidentId)?.place,
        agent: DEMO_AGENTS.find((item) => item.id === intervention.agentId),
      };
    }),
  );
  protected readonly filteredInterventions = computed(() => {
    const { q, status, assignee } = this.filters();
    const search = q.trim().toLowerCase();
    return this.rows().filter(
      ({ intervention, equipment, place }) =>
        (!status || intervention.status === status) &&
        (!assignee || intervention.agentId === assignee) &&
        [intervention.id, intervention.title, equipment?.id ?? '', equipment?.name ?? '', place ?? ''].some(
          (value) => value.toLowerCase().includes(search),
        ),
    );
  });

  constructor() {
    afterNextRender(() => this.document.getElementById('main-content')?.focus());
  }

  protected updateFilter(name: keyof InterventionFilters, value: string): void {
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
