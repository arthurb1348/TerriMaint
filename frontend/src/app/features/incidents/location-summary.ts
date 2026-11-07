import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IncidentCoordinates } from './incident-location';

@Component({
  selector: 'app-location-summary',
  imports: [DecimalPipe],
  template: `@if (coordinates(); as value) {
      <p>Latitude : {{ value.latitude | number: '1.0-6' }}</p>
      <p>Longitude : {{ value.longitude | number: '1.0-6' }}</p>
      @if (value.accuracy !== undefined) {
        <p>Précision : {{ value.accuracy | number: '1.0-1' }} m</p>
      }
    } @else {
      <p>Aucune localisation ajoutée.</p>
    }`,
})
export class LocationSummary {
  readonly coordinates = input<IncidentCoordinates>();
}
