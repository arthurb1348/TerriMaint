import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { Map } from 'leaflet';
import { IncidentCoordinates, validCoordinates } from './incident-location';

@Component({
  selector: 'app-incident-map',
  templateUrl: './incident-map.html',
  styleUrl: './incident-map.css',
})
export class IncidentMap {
  readonly incidentId = input.required<string>();
  readonly coordinates = input<IncidentCoordinates>();
  private readonly canvas = viewChild<ElementRef<HTMLDivElement>>('canvas');
  private readonly injector = inject(Injector);
  protected readonly state = signal<'closed' | 'loading' | 'ready' | 'error'>('closed');
  private map?: Map;
  private generation = 0;
  private deadline?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      this.incidentId();
      this.coordinates();
      this.reset();
    });
    inject(DestroyRef).onDestroy(() => this.reset());
  }

  protected toggle(): void {
    if (this.state() === 'loading' || this.state() === 'ready') {
      this.reset();
      return;
    }
    const coordinates = this.coordinates();
    if (!coordinates || !validCoordinates(coordinates)) return;
    this.reset();
    const generation = this.generation;
    this.state.set('loading');
    this.deadline = setTimeout(() => this.fail(generation), 10_000);
    afterNextRender(() => void this.load(coordinates, generation), { injector: this.injector });
  }

  private async load(coordinates: IncidentCoordinates, generation: number): Promise<void> {
    try {
      // Le moteur est servi par TerriMaint ; aucun CDN ni fond avant l'action explicite.
      const leaflet = await import('leaflet/dist/leaflet-src.esm.js');
      if (generation !== this.generation) return;
      const canvas = this.canvas()?.nativeElement;
      if (!canvas) return;
      const position: [number, number] = [coordinates.latitude, coordinates.longitude];
      const map = leaflet.map(canvas, {
        center: position,
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
      });
      this.map = map;
      const pin =
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 38C12 30 2 23 2 16a14 14 0 0 1 28 0c0 7-10 14-14 22Z" fill="#234e3f" stroke="white" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="white"/></svg>';
      leaflet
        .marker(position, {
          icon: leaflet.icon({
            iconUrl: `data:image/svg+xml,${encodeURIComponent(pin)}`,
            iconSize: [32, 40],
            iconAnchor: [16, 40],
          }),
          alt: 'Position jointe au signalement',
          keyboard: false,
          interactive: false,
        })
        .addTo(map);
      const tiles = leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        // L'origine identifie le site pour OSM sans transmettre le chemin de la fiche.
        referrerPolicy: 'strict-origin',
        keepBuffer: 0,
        detectRetina: false,
      });
      tiles.on('tileerror', () => queueMicrotask(() => this.fail(generation)));
      tiles.on('load', () => {
        if (generation !== this.generation) return;
        clearTimeout(this.deadline);
        this.state.set('ready');
      });
      tiles.addTo(map);
    } catch {
      this.fail(generation);
    }
  }

  private fail(generation: number): void {
    if (generation !== this.generation) return;
    this.reset();
    this.state.set('error');
  }

  private reset(): void {
    // Invalider aussi l'import et les événements tardifs d'une ancienne fiche.
    ++this.generation;
    clearTimeout(this.deadline);
    this.map?.remove();
    this.map = undefined;
    this.state.set('closed');
  }
}
