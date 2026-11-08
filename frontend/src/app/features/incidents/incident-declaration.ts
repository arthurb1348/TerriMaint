import { IncidentAudio } from './incident-audio';
import { AudioNote } from './audio-note';
import { IncidentLocation } from './incident-location';
import { LocationSummary } from './location-summary';
import { DemoData } from '../../core/demo-data';
import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  DestroyRef,
  Injector,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IncidentPhotos } from './incident-photos';
import { Incident, INCIDENT_PLACE_LIMIT } from './incident';
import { incidentQueryParams, readIncidentFilters } from './incident-filters';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';

const nonBlank: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim() ? null : { blank: true };

@Component({
  selector: 'app-incident-declaration',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LocationSummary, AudioNote],
  templateUrl: './incident-declaration.html',
  styleUrl: './incident-declaration.css',
})
export class IncidentDeclaration {
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
  private readonly equipmentId = computed(() => this.params().get('equipmentId'));
  protected readonly placeMode = this.route.snapshot.data['placeIncident'] === true;
  private readonly space = this.route.snapshot.routeConfig?.path?.startsWith('responsable/')
    ? 'responsable'
    : 'agent';
  protected readonly equipment = computed(() =>
    DEMO_EQUIPMENT.find((item) => item.id === this.equipmentId()),
  );
  protected readonly search = computed(() => this.queryParams().get('q') ?? '');
  protected readonly returnLink = computed(() =>
    this.placeMode
      ? ['/agent/incidents']
      : this.equipment()
        ? [`/${this.space}/equipements`, this.equipment()!.id]
        : [`/${this.space}/equipements`],
  );
  protected readonly returnQuery = computed(() =>
    this.placeMode
      ? incidentQueryParams(readIncidentFilters(this.queryParams()))
      : { q: this.search() || null },
  );
  protected readonly createdLink = computed(() => [
    `/${this.space}/incidents`,
    this.createdIncident()?.id,
  ]);
  protected readonly step = signal<'form' | 'review' | 'complete'>('form');
  protected readonly audio = new IncidentAudio();
  protected readonly location = new IncidentLocation();
  protected readonly media = new IncidentPhotos();
  protected readonly submitted = signal(false);
  protected readonly createdIncident = signal<Incident | undefined>(undefined);
  protected readonly priorities = [
    { value: 'low', label: 'Basse', explanation: 'intervention à planifier' },
    { value: 'high', label: 'Haute', explanation: 'intervention rapide' },
    { value: 'urgent', label: 'Urgente', explanation: 'danger immédiat' },
  ] as const;
  // Bornes de démonstration : elles ne constituent pas encore un contrat de validation serveur.
  protected readonly titleLimit = 120;
  protected readonly placeLimit = INCIDENT_PLACE_LIMIT;
  protected readonly descriptionLimit = 2000;
  protected readonly form = new FormGroup({
    place: new FormControl('', {
      nonNullable: true,
      validators: [
        (control) => (this.placeMode ? nonBlank(control) : null),
        Validators.maxLength(this.placeLimit),
      ],
    }),
    title: new FormControl('', {
      nonNullable: true,
      validators: [nonBlank, Validators.maxLength(this.titleLimit)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      // Des espaces seuls représentent une absence ; la borne porte sur les détails fournis.
      validators: [
        (control) =>
          control.value.trim() ? Validators.maxLength(this.descriptionLimit)(control) : null,
      ],
    }),
    priority: new FormControl('', {
      nonNullable: true,
      validators: [
        (control) =>
          this.priorities.some((priority) => priority.value === control.value)
            ? null
            : { priority: true },
      ],
    }),
    risk: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.media.clear();
      this.location.clear();
      this.audio.clear();
    });
    effect(() => {
      // Le routeur réutilise le composant : aucune saisie ne doit passer à un autre matériel.
      // q reste indépendant : modifier la recherche seule n'efface pas le formulaire.
      this.equipmentId();
      this.media.clear();
      this.location.clear();
      this.audio.clear();
      this.form.reset();
      this.createdIncident.set(undefined);
      this.submitted.set(false);
      this.step.set('form');
      afterNextRender(() => this.document.getElementById('main-content')?.focus(), {
        injector: this.injector,
      });
    });
  }

  protected recordAudio(): void {
    const equipmentId = this.route.snapshot.paramMap.get('equipmentId');
    void this.audio.start(
      () =>
        this.route.snapshot.paramMap.get('equipmentId') === equipmentId && this.step() === 'form',
    );
  }

  protected removeAudio(): void {
    this.audio.clear();
    this.focusAfterRender('#record-audio');
  }

  protected requestLocation(): void {
    const equipmentId = this.route.snapshot.paramMap.get('equipmentId');
    this.location.request(
      this.document.defaultView?.navigator.geolocation,
      () =>
        this.route.snapshot.paramMap.get('equipmentId') === equipmentId && this.step() === 'form',
    );
  }

  protected selectPhotos(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length) void this.media.add(files);
  }

  protected removePhoto(id: number): void {
    const photos = this.media.photos();
    const index = photos.findIndex((photo) => photo.id === id);
    this.media.remove(id);
    const next = this.media.photos()[index] ?? this.media.photos()[index - 1];
    this.focusAfterRender(next ? `#remove-photo-${next.id}` : '#incident-photos');
  }

  protected invalid(field: 'place' | 'title' | 'description' | 'priority'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (this.submitted() || control.touched);
  }

  protected review(): void {
    if (
      this.audio.state() !== 'idle' ||
      this.createdIncident() ||
      this.media.busy() ||
      (!this.placeMode && !this.equipment()) ||
      this.step() !== 'form'
    )
      return;
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      const field = (['place', 'title', 'description', 'priority'] as const).find(
        (name) => this.form.controls[name].invalid,
      )!;
      this.focusAfterRender(field === 'priority' ? '#priority-low' : `#incident-${field}`);
      return;
    }
    this.location.stop();
    this.step.set('review');
    this.focusAfterRender('#incident-title-heading');
  }

  protected edit(): void {
    if (this.createdIncident() || this.step() !== 'review') return;
    this.step.set('form');
    this.focusAfterRender('#incident-title');
  }

  protected complete(): void {
    if (
      this.audio.state() !== 'idle' ||
      this.createdIncident() ||
      this.media.busy() ||
      (!this.placeMode && !this.equipment()) ||
      this.step() !== 'review' ||
      this.form.invalid
    )
      return;
    const { place, ...values } = this.form.getRawValue();
    const incident = this.data.createIncident({
      ...values,
      ...(this.placeMode ? { place } : { equipmentId: this.equipment()!.id }),
      photos: this.media.photos(),
      coordinates: this.location.value(),
      audioNote: this.audio.note(),
    });
    if (!incident) return;
    this.createdIncident.set(incident);
    this.media.transfer();
    this.audio.transfer();
    this.step.set('complete');
    this.focusAfterRender('#incident-title-heading');
  }

  protected priorityLabel(): string {
    const priority = this.priorities.find(
      (item) => item.value === this.form.controls.priority.value,
    );
    return priority ? `${priority.label} — ${priority.explanation}` : '';
  }

  protected descriptionLabel(): string {
    const description = this.form.controls.description.value;
    // Le texte d'absence reste une présentation : Modifier retrouve la saisie intacte.
    return description.trim() ? description : 'Non renseignée';
  }

  protected revealDescription(control: HTMLTextAreaElement): void {
    // Au focus, le navigateur peut ne dégager que le curseur de saisie : centrer le champ
    // multiligne évite que sa partie basse reste cachée derrière la navigation Agent.
    control.scrollIntoView?.({ block: 'center' });
  }

  private focusAfterRender(selector: string): void {
    afterNextRender(
      () => {
        const control = this.host.nativeElement.querySelector<HTMLElement>(selector);
        control?.focus();
        control?.scrollIntoView?.({ block: 'center' });
      },
      {
        injector: this.injector,
      },
    );
  }
}
