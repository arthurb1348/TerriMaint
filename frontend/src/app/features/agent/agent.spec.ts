import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { DemoData } from '../../core/demo-data';
import { DEMO_INTERVENTIONS } from '../interventions/interventions-demo';
import { Agent } from './agent';

describe('Accueil Agent', () => {
  it('réagit aux affectations partagées, puis présente un vide utile', async () => {
    const interventions = signal(DEMO_INTERVENTIONS);
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: DemoData, useValue: { interventions } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Agent);
    fixture.detectChanges();
    const content: HTMLElement = fixture.nativeElement;
    expect(content.textContent).toContain('Camille Durand');
    expect(
      Array.from(content.querySelectorAll('.preview-link .reference'), (node) => node.textContent),
    ).toEqual(['INT-2026-035', 'INT-2026-032']);
    interventions.set([]);
    fixture.detectChanges();
    expect(content.textContent).toContain('Aucune intervention active assignée');
    expect(content.querySelector('.preview-link')).toBeNull();
    expect(content.querySelector('a[href="/agent/interventions"]')).not.toBeNull();
    fixture.destroy();
  });
});
