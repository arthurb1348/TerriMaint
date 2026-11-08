import { Incident } from './incident';

// Amorçage immuable de DemoData : les créations en mémoire ne modifient pas ces exemples.
// Les noms et emplacements restent dans DEMO_EQUIPMENT, reliés uniquement par equipmentId.
export const DEMO_INCIDENTS: readonly Incident[] = [
  {
    id: 'INC-2026-045',
    // Point fictif fixe pour la revue de la carte ; aucune position de téléphone réelle.
    coordinates: { latitude: 48.25, longitude: -1.5, accuracy: 12 },
    title: 'Moteur qui cale à l’accélération',
    description: 'Le moteur cale lors de l’accélération et devient difficile à redémarrer.',
    equipmentId: 'EQ-OUT-0003',
    priority: 'low',
    status: 'open',
    reportedOn: '2026-10-28',
  },
  {
    id: 'INC-2026-046',
    title: 'Bruit au freinage du fourgon de voirie',
    description: 'Un bruit métallique est audible au freinage, notamment à faible vitesse.',
    equipmentId: 'EQ-VEH-0042',
    priority: 'urgent',
    status: 'open',
    reportedOn: '2026-10-29',
    risk: true,
  },
  {
    id: 'INC-2026-047',
    photos: [{ src: '/images/demo/heating-controls.webp', alt: 'Exemple fictif : commandes du chauffage' }, { src: '/images/demo/heating-pipes.webp', alt: 'Exemple fictif : distribution des tuyaux de chauffage' }],
    title:
      'Température irrégulière dans les salles du groupe scolaire malgré le réglage habituel du chauffage',
    description:
      'Les salles du rez-de-chaussée restent fraîches alors que celles de l’étage sont trop chaudes. Le phénomène a été observé à l’ouverture du bâtiment et en fin de matinée, avec les réglages habituels.\n\nLe panneau de commande ne présente pas de message d’erreur. Les observations concernent plusieurs salles et ne permettent pas de déterminer l’origine du problème. Ces informations décrivent uniquement la situation constatée sur place.',
    equipmentId: 'EQ-BAT-0011',
    priority: 'high',
    status: 'in-progress',
    reportedOn: '2026-10-27',
  },
  {
    id: 'INC-2026-048',
    title: 'Vibration du plateau de coupe',
    equipmentId: 'EQ-OUT-0001',
    priority: 'high',
    status: 'in-progress',
    reportedOn: '2026-10-26',
  },
  {
    id: 'INC-2026-049',
    title: 'Sangle du souffleur usée',
    description: 'Le bord de la sangle est effiloché au niveau de la fixation.',
    equipmentId: 'EQ-OUT-0002',
    priority: 'low',
    status: 'closed',
    reportedOn: '2026-10-22',
  },
  {
    id: 'INC-2026-050',
    photos: [{ src: '/images/demo/hose-joint.webp', alt: 'Exemple fictif : raccord du flexible et gouttes au sol' }],
    title: 'Fuite au raccord du flexible',
    description:
      'Une fuite est visible au raccord lorsque le nettoyeur est mis sous pression.\nLe sol devient glissant autour de la zone de travail.',
    equipmentId: 'EQ-OUT-0004',
    priority: 'urgent',
    status: 'closed',
    reportedOn: '2026-10-21',
    risk: true,
  },
];
