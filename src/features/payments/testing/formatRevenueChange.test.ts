import { describe, expect, it } from 'vitest';
import {
  formatRevenueChangeLabel,
  revenueChangeTone,
  revenueVersusLabel,
} from '../utils/formatRevenueChange';

describe('formatRevenueChange', () => {
  it('labels week-over-week movement', () => {
    expect(revenueVersusLabel('week')).toBe('last week');
    expect(formatRevenueChangeLabel(12, 'last week')).toBe(
      '↑ 12% vs last week'
    );
    expect(formatRevenueChangeLabel(-8, 'last week')).toBe('↓ 8% vs last week');
    expect(formatRevenueChangeLabel(0, 'last week')).toBe('Flat vs last week');
    expect(formatRevenueChangeLabel(null, 'last week')).toBe('vs last week');
  });

  it('compares month to last month', () => {
    expect(revenueVersusLabel('month')).toBe('last month');
    expect(revenueVersusLabel('year')).toBe('last year');
  });

  it('hides a comparison for all time', () => {
    expect(revenueVersusLabel('all')).toBe('');
    expect(formatRevenueChangeLabel(12, '')).toBe('');
  });

  it('maps tone for color', () => {
    expect(revenueChangeTone(4)).toBe('up');
    expect(revenueChangeTone(-2)).toBe('down');
    expect(revenueChangeTone(0)).toBe('neutral');
    expect(revenueChangeTone(null)).toBe('neutral');
  });
});
