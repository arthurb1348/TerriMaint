import { PRESENTED_AGENT } from '../../core/presented-agent';
import { DemoData } from '../../core/demo-data';
import { DatePipe, DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, inject, Injector, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { DEMO_AGENTS } from './agents-demo';
import { INTERVENTION_STATUSES } from './intervention';
import { interventionQueryParams, readInterventionFilters } from './intervention-filters';

@Component({
  selector: 'app-intervention-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './intervention-detail.html',
  styleUrls: ['../incidents/incident-presentation.css', './intervention-detail.css'],
})
export class InterventionDetail {
  private readonly injector = inject(Injector);
  private readonly completedId = signal<string | null>(null);
  private readonly data = inject(DemoData);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly agentView = this.route.snapshot.data['agentView'] === true;
  protected readonly presentedAgent = PRESENTED_AGENT;
  private readonly candidate = computed(() => this.data.getIntervention(this.params().get('id')));
  protected readonly otherAgent = computed(
    () => this.agentView && !!this.candidate() && this.candidate()!.agentId !== PRESENTED_AGENT.id,
  );
  protected readonly intervention = computed(() =>
    this.otherAgent() ? undefined : this.candidate(),
  );
  protected readonly incident = computed(() =>
    this.data.getIncident(this.intervention()?.incidentId),
  );
  protected readonly equipment = computed(() =>
    DEMO_EQUIPMENT.find((item) => item.id === this.intervention()?.equipmentId),
  );
  protected readonly agent = computed(() =>
    DEMO_AGENTS.find((item) => item.id === this.intervention()?.agentId),
  );
  protected readonly instructions = computed(() => {
    const value = this.intervention()?.instructions;
    return value?.trim() ? value : 'Non renseignées';
  });
  protected readonly query = computed(() =>
    interventionQueryParams(readInterventionFilters(this.queryParams(), this.agentView)),
  );
  protected readonly equipmentOrigin = computed(() =>
    this.equipment()?.id === this.queryParams().get('fromEquipment') ? this.equipment()?.id : undefined,
  );
  protected readonly statuses = INTERVENTION_STATUSES;

  protected readonly completionMessage = computed(() =>
    this.completedId() && this.completedId() === this.params().get('id')
      ? 'L’intervention est maintenant terminée.'
      : '',
  );

  protected completeIntervention(): void {
    if (!this.agentView) return;
    const id = this.params().get('id');
    if (!this.data.completeAssignedIntervention(id)) return;
    this.completedId.set(id);
    // Le bouton disparaît après la transition : conserver un repère de focus sur la fiche.
    afterNextRender(
      () => {
        if (this.params().get('id') === id)
          this.document.getElementById('intervention-completion-feedback')?.focus();
      },
      { injector: this.injector },
    );
  }

  constructor() {
    afterNextRender(() => this.document.getElementById('main-content')?.focus());
  }
}
