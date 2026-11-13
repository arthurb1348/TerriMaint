import { INCIDENT_STATUSES } from '../incidents/incident';
import { DatePipe } from '@angular/common';
import { DemoData } from '../../core/demo-data';
import { PRESENTED_AGENT } from '../../core/presented-agent';
import { activeInterventionPreview } from '../interventions/assigned-interventions';
import { INTERVENTION_STATUSES } from '../interventions/intervention';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-agent',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <section class="feature-page" aria-labelledby="agent-title">
      <h1 id="agent-title">Accueil</h1>
      <p>Pour {{ presentedAgent.name }}</p>
      <a class="scanner-card" routerLink="/agent/scanner">
        <img src="/icons/scan.svg" alt="" aria-hidden="true" width="56" height="56" />
        <span>Scanner</span>
      </a>
      <section class="intervention-preview" aria-labelledby="active-interventions-title">
        <h2 id="active-interventions-title">Interventions actives</h2>
        @if (preview().length) {
          <ul class="preview-list">
            @for (item of preview(); track item.id) {
              <li>
                <a
                  class="business-card preview-link"
                  [routerLink]="['/agent/interventions', item.id]"
                >
                  <span class="reference">{{ item.id }}</span>
                  <strong>{{ item.title }}</strong>
                  <span class="badge">{{ statuses[item.status] }}</span>
                  <span
                    >Date prévue :
                    <time [attr.datetime]="item.plannedOn">{{
                      item.plannedOn | date: 'dd/MM/yyyy'
                    }}</time></span
                  >
                </a>
              </li>
            }
          </ul>
        } @else {
          <p>
            Aucune intervention active assignée pour le moment. Consultez la liste pour retrouver
            vos interventions terminées.
          </p>
        }
        <a class="page-action secondary" routerLink="/agent/interventions"
          >Voir toutes mes interventions</a
        >
      </section>
      <section class="incident-preview" aria-labelledby="recent-incidents-title">
        <h2 id="recent-incidents-title">Derniers signalements</h2>
        @if (recentIncidents().length) {
          <ul class="recent-incidents-list">
            @for (item of recentIncidents(); track item.id) {
              <li>
                <a class="business-card recent-incident-link" [routerLink]="['/agent/incidents', item.id]">
                  <strong>{{ item.title }}</strong>
                  <span class="badge">{{ incidentStatuses[item.status] }}</span>
                </a>
              </li>
            }
          </ul>
        } @else {
          <p>Aucun signalement pour le moment.</p>
        }
        <div class="incident-actions">
          <a class="page-action" routerLink="/agent/incidents/nouveau">Nouveau signalement</a>
          <a class="page-action secondary" routerLink="/agent/incidents">Voir tous les signalements</a>
        </div>
      </section>
    </section>
  `,
  styleUrls: ['../incidents/incident-presentation.css', './agent.css'],
})
export class Agent {
  private readonly data = inject(DemoData);
  protected readonly presentedAgent = PRESENTED_AGENT;
  protected readonly statuses = INTERVENTION_STATUSES;
  protected readonly incidentStatuses = INCIDENT_STATUSES;
  protected readonly recentIncidents = computed(() =>
    this.data.incidents()
      .map((item, index) => ({ item, index }))
      // L'index départage les dates égales sans trier la collection partagée.
      .sort((left, right) => right.item.reportedOn.localeCompare(left.item.reportedOn) || right.index - left.index)
      .slice(0, 2)
      .map(({ item }) => item),
  );
  protected readonly preview = computed(() => activeInterventionPreview(this.data.interventions()));
}
