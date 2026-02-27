/**
 * dates-helper.ts
 * Wrapper around @jhauga/getdate for date templating in emails.
 * Provides formatted dates for use in subject lines, HTML content, and text templates.
 */

import { getDate } from '@jhauga/getdate';
import type { TemplateVariables } from '../core/types.js';

/**
 * Structure of all available date template variables.
 * These are exposed as {{dates.*}} in email templates.
 */
export interface DatesTemplateVars {
  /** MM-DD-YY format (e.g., "02-26-26") */
  'dates.date': string;
  /** Two-digit year only (e.g., "26") */
  'dates.twoDigitYear': string;
  /** Full current month name (e.g., "February") */
  'dates.month': string;
  /** Abbreviated current month name (e.g., "Feb") */
  'dates.monthShort': string;
  /** Full previous month name (e.g., "January") */
  'dates.lastMonth': string;
  /** Abbreviated previous month name (e.g., "Jan") */
  'dates.lastMonthShort': string;
  /** Current fiscal quarter (1-4) */
  'dates.quarter': number;
  /** Last fiscal quarter (1-4) */
  'dates.lastQuarter': number;
  /** Four-digit current year (e.g., "2026") */
  'dates.year': string;
  /** Four-digit last year (e.g., "2025") */
  'dates.lastYear': string;
  /** Four-digit next year (e.g., "2027") */
  'dates.nextYear': string;
  /** Day of month as two digits (e.g., "26") */
  'dates.day': string;
  /** Month number as two digits (e.g., "02") */
  'dates.monthNumber': string;
  /** Full date MM-DD-YYYY (e.g., "02-26-2026") */
  'dates.fullDate': string;
  /** Slash-separated date MM/DD/YY (e.g., "02/26/26") */
  'dates.slashDate': string;
  /** Terminal date format MM/DD/YYYY (e.g., "02/26/2026") */
  'dates.terminalDate': string;
  /** ISO date format YYYY-MM-DD (e.g., "2026-02-26") */
  'dates.isoDate': string;
  /** Current season name (e.g., "Winter") */
  'dates.season': string;
  /** Leap year indicator (1 = leap year, 0 = not) */
  'dates.isLeapYear': number;
}

/**
 * Build all dates.* template variables using @jhauga/getdate.
 * Call this once per email build to get fresh date values.
 *
 * @returns Object with all dates.* template variables populated
 *
 * @example
 * ```typescript
 * const vars = buildDatesVars();
 * // vars['dates.lastMonth'] → "January"
 * // vars['dates.quarter'] → 1
 * // vars['dates.year'] → "2026"
 * ```
 */
export function buildDatesVars(): Partial<TemplateVariables> {
  // Get default date values
  const defaultResult = getDate();

  // Get additional values that require specific options
  const dayResult = getDate({ day: true, dayMonth: true });
  const fullResult = getDate({ full: true });
  const slashResult = getDate({ slash: true });
  const terminalResult = getDate({ terminalDate: true });
  const seasonResult = getDate({ quarter: true, season: true });
  const leapResult = getDate({ leap: true });
  const lastQuarterResult = getDate({ lastQuarter: true });
  const lastYearResult = getDate({ lastYear: true });
  const nextYearResult = getDate({ nextYear: true });
  const monthShortResult = getDate({ month: true, abbreviated: true });
  const lastMonthShortResult = getDate({ lastMonth: true, abbreviated: true });

  // Build ISO date format YYYY-MM-DD
  const year = defaultResult.year ?? new Date().getFullYear().toString();
  const monthNum = dayResult.monthNumber ?? String(new Date().getMonth() + 1).padStart(2, '0');
  const day = dayResult.day ?? String(new Date().getDate()).padStart(2, '0');
  const isoDate = `${year}-${monthNum}-${day}`;

  return {
    // Default call values
    'dates.date': defaultResult.date ?? '',
    'dates.twoDigitYear': defaultResult.twoDigitDate ?? '',
    'dates.month': defaultResult.month ?? '',
    'dates.lastMonth': defaultResult.lastMonth ?? '',
    'dates.quarter': defaultResult.quarter as number ?? 0,
    'dates.year': defaultResult.year ?? '',

    // Additional option values
    'dates.day': dayResult.day ?? '',
    'dates.monthNumber': dayResult.monthNumber ?? '',
    'dates.fullDate': fullResult.fullDate ?? '',
    'dates.slashDate': slashResult.date ?? '',
    'dates.terminalDate': terminalResult.terminalDate ?? '',
    'dates.season': seasonResult.quarter as string ?? '',
    'dates.isLeapYear': leapResult.checkLeapYear ?? 0,
    'dates.lastQuarter': lastQuarterResult.lastQuarter ?? 0,
    'dates.lastYear': lastYearResult.lastYear ?? '',
    'dates.nextYear': nextYearResult.nextYear ?? '',
    'dates.monthShort': monthShortResult.month ?? '',
    'dates.lastMonthShort': lastMonthShortResult.lastMonth ?? '',

    // Computed values
    'dates.isoDate': isoDate,
  };
}

/**
 * Get a single dates.* variable by name.
 *
 * @param varName - The variable name without 'dates.' prefix (e.g., 'lastMonth')
 * @returns The formatted date value
 *
 * @example
 * ```typescript
 * getDateVar('lastMonth'); // "January"
 * getDateVar('quarter');   // 1
 * ```
 */
export function getDateVar(varName: string): string | number | boolean {
  const vars = buildDatesVars();
  const key = `dates.${varName}` as keyof DatesTemplateVars;
  return vars[key] ?? '';
}
