import { Routes } from '@angular/router';
import { Home } from './home/home';

const equipmentPage = () => import('./features/equipements/equipements').then((m) => m.Equipements);
const equipmentDetailPage = () =>
  import('./features/equipements/equipment-detail').then((m) => m.EquipmentDetail);
const incidentsPage = () => import('./features/incidents/incidents').then((m) => m.Incidents);
const incidentDeclarationPage = () =>
  import('./features/incidents/incident-declaration').then((m) => m.IncidentDeclaration);
const incidentDetailPage = () =>
  import('./features/incidents/incident-detail').then((m) => m.IncidentDetail);
const interventionsPage = () =>
  import('./features/interventions/interventions').then((m) => m.Interventions);
const upcomingPage = () =>
  import('./shared/upcoming-page/upcoming-page').then((m) => m.UpcomingPage);

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'TerriMaint — Du terrain à la décision',
  },
  {
    path: 'agent',
    loadComponent: () => import('./features/agent/agent').then((m) => m.Agent),
    title: 'Accueil Agent — TerriMaint',
  },
  {
    path: 'responsable',
    loadComponent: () => import('./features/responsable/responsable').then((m) => m.Responsable),
    title: 'Tableau de bord — TerriMaint',
  },
  {
    // Cette création sans matériel doit précéder le détail incidents/:id.
    path: 'agent/incidents/nouveau',
    loadComponent: incidentDeclarationPage,
    title: 'Nouveau signalement — TerriMaint',
    data: { placeIncident: true },
  },
  ...(['agent', 'responsable'] as const).flatMap((space): Routes => [
    {
      path: `${space}/equipements/:id`,
      loadComponent: equipmentDetailPage,
      title: 'Fiche matériel — TerriMaint',
      data: { agentView: space === 'agent' },
    },
    {
      path: `${space}/equipements`,
      loadComponent: equipmentPage,
      title: 'Matériel — TerriMaint',
    },
    {
      path: `${space}/incidents/nouveau/:equipmentId`,
      loadComponent: incidentDeclarationPage,
      title: 'Faire un signalement — TerriMaint',
    },
    {
      // La route spécifique nouveau/:equipmentId reste avant le détail par identifiant.
      path: `${space}/incidents/:id`,
      loadComponent: incidentDetailPage,
      title: 'Détail du signalement — TerriMaint',
    },
    {
      path: `${space}/incidents`,
      loadComponent: incidentsPage,
      title: 'Signalements — TerriMaint',
    },
  ]),
  {
    path: 'responsable/interventions/materiel/:equipmentId',
    loadComponent: () =>
      import('./features/interventions/intervention-planning').then((m) => m.InterventionPlanning),
    title: 'Programmer une intervention — TerriMaint',
  },
  {
    // Cette entrée appartient au parcours Responsable ; ce n'est pas une autorisation métier.
    path: 'responsable/interventions/nouvelle/:incidentId',
    loadComponent: () =>
      import('./features/interventions/intervention-planning').then((m) => m.InterventionPlanning),
    title: 'Programmer une intervention — TerriMaint',
  },
  ...(['agent', 'responsable'] as const).flatMap((space): Routes => [
    {
      // La programmation Responsable reste prioritaire sur le détail par id.
      path: `${space}/interventions/:id`,
      loadComponent: () =>
        import('./features/interventions/intervention-detail').then((m) => m.InterventionDetail),
      title: 'Détail de l’intervention — TerriMaint',
      data: {
        agentView: space === 'agent',
      },
    },
    {
      path: `${space}/interventions`,
      loadComponent: interventionsPage,
      title: `${space === 'agent' ? 'Mes interventions' : 'Interventions'} — TerriMaint`,
      data: {
        agentView: space === 'agent',
      },
    },
  ]),
  ...(['agent', 'responsable'] as const).map((space) => ({
    path: `${space}/scanner`,
    loadComponent: () => import('./features/scanner/scanner').then((m) => m.Scanner),
    title: 'Scanner — TerriMaint',
    data: { scannerSpace: space },
  })),
  ...[
    {
      path: 'agent/profil',
      label: 'Profil',
      description: 'Le profil sera disponible après la mise en place de l’authentification.',
    },
    {
      path: 'responsable/agents',
      label: 'Agents',
      description: 'La consultation des intervenants sera développée dans un prochain incrément.',
    },
  ].map(({ path, label, description }) => ({
    path,
    loadComponent: upcomingPage,
    title: `${label} — TerriMaint`,
    data: { label, description },
  })),
  // Les anciennes URL restent accessibles ; les nouvelles conservent le contexte de navigation.
  { path: 'equipements', redirectTo: 'agent/equipements', pathMatch: 'full' },
  { path: 'incidents', redirectTo: 'agent/incidents', pathMatch: 'full' },
  { path: 'interventions', redirectTo: 'responsable/interventions', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
