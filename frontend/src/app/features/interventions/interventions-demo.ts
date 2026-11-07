import { Intervention } from './intervention';

// Amorçage immuable de DemoData : les créations en mémoire restent séparées de ces exemples.
// Les informations d'origine restent dans leurs sources, reliées par identifiant.
export const DEMO_INTERVENTIONS: readonly Intervention[] = [
  {
    id: 'INT-2026-032',
    title: 'Diagnostic et remise en état du système d’alimentation',
    instructions: 'Contrôler le circuit d’alimentation.\nPréparer les pièces utiles au diagnostic.',
    equipmentId: 'EQ-OUT-0003',
    incidentId: 'INC-2026-045',
    agentId: 'AG-DEMO-001',
    plannedOn: '2026-11-03',
    status: 'planned',
  },
  {
    id: 'INT-2026-033',
    title: 'Contrôle du système de freinage',
    instructions: 'Examiner les éléments de freinage avant toute remise en service.',
    equipmentId: 'EQ-VEH-0042',
    incidentId: 'INC-2026-046',
    agentId: 'AG-DEMO-003',
    plannedOn: '2026-11-02',
    status: 'planned',
  },
  {
    id: 'INT-2026-034',
    title:
      'Diagnostic du chauffage et vérification de la répartition de température dans les salles du groupe scolaire',
    instructions:
      'Comparer les réglages et les températures observées dans les différentes salles. Examiner le panneau de commande et les organes de régulation.\n\nLes observations du signalement concernent plusieurs pièces et plusieurs moments de la journée. Prévoir une vérification de l’ensemble du circuit avant de conclure sur l’origine du problème.',
    equipmentId: 'EQ-BAT-0011',
    incidentId: 'INC-2026-047',
    agentId: 'AG-DEMO-002',
    plannedOn: '2026-10-31',
    status: 'in-progress',
  },
  {
    id: 'INT-2026-035',
    title: 'Vérification du plateau de coupe',
    equipmentId: 'EQ-OUT-0001',
    incidentId: 'INC-2026-048',
    agentId: 'AG-DEMO-001',
    plannedOn: '2026-10-30',
    status: 'in-progress',
  },
  {
    id: 'INT-2026-036',
    title: 'Remplacement de la sangle',
    instructions: 'Vérifier la fixation et le réglage de la sangle de remplacement.',
    equipmentId: 'EQ-OUT-0002',
    incidentId: 'INC-2026-049',
    agentId: 'AG-DEMO-003',
    plannedOn: '2026-10-24',
    status: 'completed',
  },
  {
    id: 'INT-2026-037',
    title: 'Remise en étanchéité du raccord',
    instructions: 'Contrôler le raccord et le flexible.',
    equipmentId: 'EQ-OUT-0004',
    incidentId: 'INC-2026-050',
    agentId: 'AG-DEMO-002',
    plannedOn: '2026-10-23',
    status: 'completed',
  },
];
