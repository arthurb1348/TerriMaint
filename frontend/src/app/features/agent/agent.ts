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
      <ul class="page-shortcuts">
        <li><a class="page-action secondary" routerLink="/agent/equipements">Matériel</a></li>
        <li><a class="page-action secondary" routerLink="/agent/incidents">Incidents</a></li>
        <li>
          <a class="page-action secondary" routerLink="/agent/interventions">Mes interventions</a>
        </li>
        <li class="scanner-shortcut">
          <a class="page-action" routerLink="/agent/scanner">Scanner un QR code</a>
        </li>
      </ul>
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
    </section>
  `,
  styleUrls: ['../incidents/incident-presentation.css', './agent.css'],
})
export class Agent {
  private readonly data = inject(DemoData);
  protected readonly presentedAgent = PRESENTED_AGENT;
  protected readonly statuses = INTERVENTION_STATUSES;
  protected readonly preview = computed(() => activeInterventionPreview(this.data.interventions()));
}
