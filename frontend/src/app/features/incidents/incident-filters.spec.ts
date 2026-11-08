import { convertToParamMap } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { DEMO_INCIDENTS } from './incidents-demo';
import {
  incidentQueryParams,
  matchesIncidentFilters,
  readIncidentFilters,
} from './incident-filters';

describe('Filtre Non clôturés', () => {
  it('lit et restitue le filtre dans les URL et refuse les valeurs inconnues', () => {
    const filters = readIncidentFilters(
      convertToParamMap({ q: '  tondeuse ', priority: 'urgent', status: 'not-closed' }),
    );
    expect(incidentQueryParams(filters)).toEqual({
      q: '  tondeuse ',
      priority: 'urgent',
      status: 'not-closed',
    });
    expect(readIncidentFilters(convertToParamMap({ status: 'unknown' })).status).toBe('');
  });
  it.each([
    ['open', true],
    ['in-progress', true],
    ['closed', false],
  ] as const)('inclut %s : %s', (status, expected) => {
    expect(
      matchesIncidentFilters(
        { ...DEMO_INCIDENTS[0], priority: 'urgent', status },
        { priority: 'urgent', status: 'not-closed' },
      ),
    ).toBe(expected);
    expect(
      matchesIncidentFilters(
        { ...DEMO_INCIDENTS[0], priority: 'high', status },
        { priority: 'urgent', status: 'not-closed' },
      ),
    ).toBe(false);
  });
});
