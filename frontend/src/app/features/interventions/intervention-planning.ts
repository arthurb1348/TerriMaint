import { DemoData } from '../../core/demo-data';
import { DatePipe, DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { INCIDENT_PRIORITIES } from '../incidents/incident';
import { incidentQueryParams, readIncidentFilters } from '../incidents/incident-filters';
import { DEMO_AGENTS } from './agents-demo';
import { localToday, plannedDateValidator } from './planning-date';
import { Intervention } from './intervention';

@Component({
  selector: 'app-intervention-planning',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './intervention-planning.html',
  styleUrls: ['../incidents/incident-presentation.css', './intervention-planning.css'],
})
export class InterventionPlanning {
  private readonly data = inject(DemoData);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly incidentId = computed(() => this.params().get('incidentId'));
  protected readonly incident = computed(() => this.data.getIncident(this.incidentId()));
  protected readonly equipment = computed(() =>
    DEMO_EQUIPMENT.find((item) => item.id === this.incident()?.equipmentId),
  );
  protected readonly canPlan = computed(() =>
    Boolean(this.incident() && this.equipment() && this.incident()?.status !== 'closed'),
  );
  protected readonly query = computed(() =>
    incidentQueryParams(readIncidentFilters(this.queryParams())),
  );
  protected readonly agents = DEMO_AGENTS;
  protected readonly priorities = INCIDENT_PRIORITIES;
  protected readonly titleLimit = 120;
  protected readonly instructionsLimit = 2000;
  protected readonly step = signal<'form' | 'review' | 'complete'>('form');
  protected readonly submitted = signal(false);
  protected readonly createdIntervention = signal<Intervention | undefined>(undefined);
  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [
        (control) => (control.value.trim() ? null : { blank: true }),
        Validators.maxLength(this.titleLimit),
      ],
    }),
    instructions: new FormControl('', {
      nonNullable: true,
      validators: [
        (control) =>
          control.value.trim() ? Validators.maxLength(this.instructionsLimit)(control) : null,
      ],
    }),
    agentId: new FormControl('', {
      nonNullable: true,
      validators: [
        (control) =>
          this.agents.some((agent) => agent.id === control.value) ? null : { agent: true },
      ],
    }),
    plannedOn: new FormControl('', {
      nonNullable: true,
      validators: [plannedDateValidator],
    }),
  });

  constructor() {
    effect(() => {
      // Réutilisation de route : changer d'identifiant efface toute programmation précédente.
      // Les seuls filtres de retour n'interviennent pas dans cet effet.
      this.incidentId();
      this.form.reset({
        title: untracked(() => this.incident()?.title ?? ''),
        instructions: '',
        agentId: '',
        plannedOn: '',
      });
      this.submitted.set(false);
      this.createdIntervention.set(undefined);
      this.step.set('form');
      afterNextRender(() => this.document.getElementById('main-content')?.focus(), {
        injector: this.injector,
      });
    });
  }

  protected get minimumDate(): string {
    return localToday();
  }

  protected invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (this.submitted() || control.touched);
  }

  protected review(): void {
    if (this.createdIntervention() || !this.canPlan() || this.step() !== 'form') return;
    if (!this.validate()) return;
    this.step.set('review');
    this.focusAfterRender('#planning-heading');
  }

  protected edit(): void {
    if (this.createdIntervention() || this.step() !== 'review') return;
    this.step.set('form');
    this.focusAfterRender('#planning-title');
  }

  protected complete(): void {
    if (this.createdIntervention() || !this.canPlan() || this.step() !== 'review') return;
    if (!this.validate()) return;
    const intervention = this.data.createIntervention({
      ...this.form.getRawValue(),
      incidentId: this.incident()!.id,
    });
    if (!intervention) return;
    this.createdIntervention.set(intervention);
    this.step.set('complete');
    this.focusAfterRender('#planning-heading');
  }

  protected instructionsLabel(): string {
    const value = this.form.controls.instructions.value;
    return value.trim() ? value : 'Non renseignées';
  }

  protected agentName(): string {
    return this.agents.find((agent) => agent.id === this.form.controls.agentId.value)?.name ?? '';
  }

  protected revealInstructions(control: HTMLTextAreaElement): void {
    // Certains navigateurs ne dégagent que le curseur : garder tout le champ visible au clavier.
    control.scrollIntoView?.({ block: 'center' });
  }

  private validate(): boolean {
    // Le jour local peut avoir changé pendant la lecture du récapitulatif.
    this.form.controls.plannedOn.updateValueAndValidity();
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.valid) return true;
    this.step.set('form');
    this.focusAfterRender('form [aria-invalid="true"]');
    return false;
  }

  private focusAfterRender(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }
}
