import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { DemoData } from '../../core/demo-data';
import { DEMO_INTERVENTIONS } from '../interventions/interventions-demo';
import { DEMO_INCIDENTS } from '../incidents/incidents-demo';
import { Agent } from './agent';

describe('Accueil Agent', () => {
  it('réagit aux affectations partagées, puis présente un vide utile', async () => {
    const interventions = signal(DEMO_INTERVENTIONS);
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: DemoData, useValue: { interventions, incidents: signal([]) } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Agent);
    fixture.detectChanges();
    const content: HTMLElement = fixture.nativeElement;
    expect(content.textContent).toContain('Camille Durand');
    expect(content.querySelector('.page-shortcuts')).toBeNull();
    expect(content.querySelector('.scanner-card')?.getAttribute('href')).toBe('/agent/scanner');
    expect(content.querySelector('.scanner-card')?.textContent).toContain('Scanner');
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
  it('limite à deux, départage les dates par ordre d’ajout, réagit et conserve la source', async () => {
    const sample = DEMO_INCIDENTS[0];
    const source = Object.freeze([
      { ...sample, id: 'ancien', title: 'Ancien', reportedOn: '2026-11-01' },
      { ...sample, id: 'premier', title: 'Premier', reportedOn: '2026-11-13' },
      { ...sample, id: 'second', title: 'Second', reportedOn: '2026-11-13', status: 'closed' as const },
      { ...sample, id: 'ajout-ancien', title: 'Ajout ancien', reportedOn: '2026-10-01' },
    ]);
    const incidents = signal<readonly typeof sample[]>(source);
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: DemoData, useValue: { incidents, interventions: signal([]) } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Agent);
    fixture.detectChanges();
    const content: HTMLElement = fixture.nativeElement;
    const links = () => Array.from(content.querySelectorAll('.recent-incident-link'));
    expect(links().map(node => node.getAttribute('href'))).toEqual(['/agent/incidents/second', '/agent/incidents/premier']);
    expect(links()[0].textContent).toContain('Clôturé');
    expect(incidents()).toBe(source);
    expect(source.map(item => item.id)).toEqual(['ancien', 'premier', 'second', 'ajout-ancien']);
    incidents.set([...source, { ...sample, id: 'troisieme', title: 'Troisième', reportedOn: '2026-11-13' }]);
    fixture.detectChanges();
    expect(links().map(node => node.getAttribute('href'))).toEqual(['/agent/incidents/troisieme', '/agent/incidents/second']);
    incidents.set([]);
    fixture.detectChanges();
    expect(links()).toHaveLength(0);
    expect(content.textContent).toContain('Aucun signalement pour le moment');
    expect(content.querySelector('a[href="/agent/incidents/nouveau"]')).not.toBeNull();
    expect(content.querySelector('a[href="/agent/incidents"]')).not.toBeNull();
    fixture.destroy();
  });

});
