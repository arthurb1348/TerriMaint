import { describe, expect, it } from 'vitest';
import { PRESENTED_AGENT } from '../../core/presented-agent';
import { activeInterventionPreview, assignedInterventions } from './assigned-interventions';
import { Intervention } from './intervention';

const item = (
  id: string,
  status: Intervention['status'],
  plannedOn: string,
  agentId = PRESENTED_AGENT.id,
): Intervention => ({
  id,
  status,
  plannedOn,
  agentId,
  title: id,
  incidentId: 'INC-2026-045',
});

describe('Affectations et aperçu Agent', () => {
  it('garde les trois statuts de Camille, sans ceux des autres agents', () => {
    const items = [
      item('a', 'planned', '2000-01-01'),
      item('b', 'in-progress', '2000-01-01'),
      item('c', 'completed', '2000-01-01'),
      item('autre', 'planned', '2000-01-01', 'AG-DEMO-002'),
    ];
    expect(assignedInterventions(items).map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
    expect(assignedInterventions([])).toEqual([]);
  });
  it('priorise en cours puis date, limite à trois, conserve égalités et dates passées sans mutation', () => {
    const items = Object.freeze([
      item('planifiée passée', 'planned', '2000-01-01'),
      item('terminée', 'completed', '1999-01-01'),
      item('en cours plus tard', 'in-progress', '2030-01-01'),
      item('égalité 1', 'in-progress', '2020-01-01'),
      item('égalité 2', 'in-progress', '2020-01-01'),
      item('autre', 'in-progress', '1990-01-01', 'AG-DEMO-002'),
    ]);
    expect(activeInterventionPreview(items).map((entry) => entry.id)).toEqual([
      'égalité 1',
      'égalité 2',
      'en cours plus tard',
    ]);
    expect(activeInterventionPreview(items.slice(0, 2)).map((entry) => entry.id)).toEqual([
      'planifiée passée',
    ]);
    expect(items[0].id).toBe('planifiée passée');
    expect(activeInterventionPreview([items[1]])).toEqual([]);
  });
  it('trie aussi les planifiées par date après les en cours, puis garde les égalités de la source', () => {
    const items = [
      item('planifiée tardive', 'planned', '2030-01-01'),
      item('égalité planifiée 1', 'planned', '2000-01-01'),
      item('égalité planifiée 2', 'planned', '2000-01-01'),
      item('en cours', 'in-progress', '2040-01-01'),
    ];
    expect(activeInterventionPreview(items).map((entry) => entry.id)).toEqual([
      'en cours',
      'égalité planifiée 1',
      'égalité planifiée 2',
    ]);
  });
});
