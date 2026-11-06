import { PRESENTED_AGENT } from '../../core/presented-agent';
import { Intervention } from './intervention';

export function assignedInterventions(items: readonly Intervention[]): readonly Intervention[] {
  return items.filter((item) => item.agentId === PRESENTED_AGENT.id);
}

export function activeInterventionPreview(items: readonly Intervention[]): readonly Intervention[] {
  // Le tri stable conserve l'ordre de la source en cas d'égalité, sans la modifier.
  // Aucune comparaison avec aujourd'hui : une planification passée reste à traiter.
  return assignedInterventions(items)
    .filter((item) => item.status !== 'completed')
    .sort(
      (left, right) =>
        Number(left.status === 'planned') - Number(right.status === 'planned') ||
        left.plannedOn.localeCompare(right.plannedOn),
    )
    .slice(0, 3);
}
