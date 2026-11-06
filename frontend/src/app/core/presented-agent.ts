import { DEMO_AGENTS } from '../features/interventions/agents-demo';

// Identité de présentation locale ; le futur serveur déterminera l'identité authentifiée.
export const PRESENTED_AGENT = DEMO_AGENTS.find((agent) => agent.id === 'AG-DEMO-001')!;
