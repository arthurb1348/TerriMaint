import { DemoData } from '../../core/demo-data';
import { DatePipe, DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DemoImage } from '../../shared/demo-image/demo-image';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { INCIDENT_PRIORITIES, INCIDENT_STATUSES } from './incident';
import { incidentQueryParams, readIncidentFilters } from './incident-filters';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DemoImage],
  templateUrl: './incident-detail.html',
  styleUrls: ['./incident-presentation.css', './incident-detail.css'],
})
export class IncidentDetail {
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
  // Suivre id évite de laisser l'ancien signalement quand Angular réutilise le composant.
  protected readonly incident = computed(() => this.data.getIncident(this.params().get('id')));
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

  constructor() {
    afterNextRender(() => this.focusContent());
  }

  protected focusContent(): void {
    this.document.getElementById('main-content')?.focus();
  }
}
