import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DemoData } from '../../core/demo-data';
import { DEMO_AGENTS } from '../interventions/agents-demo';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="feature-page" aria-labelledby="agents-title">
      <h1 id="agents-title">Agents</h1>
      <p>Les compteurs résument les interventions planifiées et en cours. La liste de chaque agent inclut aussi ses interventions terminées.</p>
      <ul class="agents-list">
        @for (row of rows(); track row.agent.id) {
          <li class="business-card" [attr.aria-labelledby]="row.agent.id">
            <h2 [id]="row.agent.id">{{ row.agent.name }}</h2>
            <dl>
              <div><dt>Planifiées</dt><dd>{{ row.planned }}</dd></div>
              <div><dt>En cours</dt><dd>{{ row.inProgress }}</dd></div>
            </dl>
            <a class="page-action secondary" routerLink="/responsable/interventions"
              [queryParams]="{ assignee: row.agent.id }"
              [attr.aria-label]="'Voir ses interventions — ' + row.agent.name">Voir ses interventions</a>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    .agents-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 24px; padding: 0; list-style: none; }
    li { min-width: 0; }
    h2 { font-size: 1.125rem; margin: 0 0 24px; }
    dl { display: flex; flex-wrap: wrap; gap: 24px; margin: 0 0 24px; }
    dd { margin: 4px 0 0; font-size: 1.5rem; font-weight: 600; }
  `,
  styleUrls: ['../incidents/incident-presentation.css'],
})
export class Agents {
  private readonly data = inject(DemoData);
  private readonly document = inject(DOCUMENT);
  protected readonly rows = computed(() => {
    const interventions = this.data.interventions();
    return DEMO_AGENTS.map((agent) => ({
      agent,
      planned: interventions.filter((item) => item.agentId === agent.id && item.status === 'planned').length,
      inProgress: interventions.filter((item) => item.agentId === agent.id && item.status === 'in-progress').length,
    }));
  });

  constructor() {
    afterNextRender(() => this.document.getElementById('main-content')?.focus());
  }
}
