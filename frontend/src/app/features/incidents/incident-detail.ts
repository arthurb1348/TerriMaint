import { DemoData } from '../../core/demo-data';
import { DatePipe, DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DemoImage } from '../../shared/demo-image/demo-image';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { assignedInterventions } from '../interventions/assigned-interventions';
import { INTERVENTION_STATUSES } from '../interventions/intervention';
import { INCIDENT_PRIORITIES, INCIDENT_STATUSES } from './incident';
import { incidentQueryParams, readIncidentFilters } from './incident-filters';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DemoImage],
  templateUrl: './incident-detail.html',
  styleUrls: [
    './incident-presentation.css',
    '../interventions/intervention-links.css',
    './incident-detail.css',
  ],
})
export class IncidentDetail {
  private readonly injector = inject(Injector);
  private readonly confirmationId = signal<string | null>(null);
  protected readonly closureMessage = signal('');
  private readonly data = inject(DemoData);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  // Contexte de présentation uniquement : les routes publiques ne contrôlent pas des permissions.
  protected readonly isResponsible =
    this.route.snapshot.routeConfig?.path?.startsWith('responsable/');
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly incidentId = computed(() => this.params().get('id'));
  // Suivre id évite de laisser l'ancien signalement quand Angular réutilise le composant.
  protected readonly incident = computed(() => this.data.getIncident(this.incidentId()));
  protected readonly description = computed(() => {
    const value = this.incident()?.description;
    return value?.trim() ? value : 'Non renseignée';
  });
  protected readonly equipment = computed(() =>
    DEMO_EQUIPMENT.find((equipment) => equipment.id === this.incident()?.equipmentId),
  );
  protected readonly query = computed(() =>
    incidentQueryParams(readIncidentFilters(this.queryParams())),
  );
  protected readonly priorities = INCIDENT_PRIORITIES;
  protected readonly statuses = INCIDENT_STATUSES;

  protected readonly canClose = computed(() => {
    const status = this.incident()?.status;
    return this.isResponsible && (status === 'open' || status === 'in-progress');
  });
  protected readonly confirmingClosure = computed(
    () => this.confirmationId() !== null && this.confirmationId() === this.incidentId(),
  );
  protected readonly interventionStatuses = INTERVENTION_STATUSES;
  protected readonly relatedInterventions = computed(() => {
    const id = this.incidentId();
    const items = this.data.interventions().filter((item) => item.incidentId === id);
    return this.isResponsible ? items : assignedInterventions(items);
  });
  protected readonly hasActiveInterventions = computed(() =>
    this.relatedInterventions().some(
      (item) => item.status === 'planned' || item.status === 'in-progress',
    ),
  );

  protected startClosure(): void {
    if (!this.canClose()) return;
    const id = this.incidentId();
    this.confirmationId.set(id);
    this.closureMessage.set('');
    this.focusAfterRender(id, 'incident-close-cancel');
  }

  protected cancelClosure(): void {
    const id = this.confirmationId();
    this.confirmationId.set(null);
    if (id) this.focusAfterRender(id, 'incident-close-action');
  }

  protected confirmClosure(): void {
    const id = this.confirmationId();
    if (!this.isResponsible || !id || id !== this.incidentId()) return;
    this.confirmationId.set(null);
    this.closureMessage.set(
      this.data.closeIncident(id)
        ? 'Le signalement est maintenant clôturé.'
        : 'La clôture n’a pas été effectuée : le signalement est introuvable ou déjà clôturé.',
    );
    this.focusAfterRender(id, 'incident-closure-feedback');
  }

  private focusAfterRender(id: string | null, target: string): void {
    // Les contrôles changent après chaque étape : déplacer le focus sur le nouveau repère.
    afterNextRender(
      () => {
        if (this.incidentId() === id)
          (
            this.document.getElementById(target) ?? this.document.getElementById('main-content')
          )?.focus();
      },
      { injector: this.injector },
    );
  }

  constructor() {
    // Une fiche réutilisée ne doit pas conserver la confirmation d’un autre signalement.
    effect(() => {
      this.incidentId();
      this.confirmationId.set(null);
      this.closureMessage.set('');
    });
    afterNextRender(() => this.focusContent());
  }

  protected focusContent(): void {
    this.document.getElementById('main-content')?.focus();
  }
}
