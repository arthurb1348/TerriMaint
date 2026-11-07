import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-responsable',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="feature-page" aria-labelledby="responsable-title">
      <h1 id="responsable-title">Tableau de bord</h1>
      <ul class="page-shortcuts">
        <li><a class="page-action secondary" routerLink="/responsable/equipements">Matériel</a></li>
        <li><a class="page-action" routerLink="/responsable/incidents">Signalements</a></li>
        <li>
          <a class="page-action secondary" routerLink="/responsable/interventions">Interventions</a>
        </li>
      </ul>
    </section>
  `,
})
export class Responsable {}
