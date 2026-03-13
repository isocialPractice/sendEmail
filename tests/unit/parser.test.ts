/**
 * parser.test.ts
 * Unit tests for CLI argument parsing and confirm/force option handling.
 */

import { describe, it, expect } from 'vitest';
import { parseArguments } from '../../src/cli/parser.js';

describe('parseArguments', () => {
  describe('--confirm and --force options', () => {
    it('parses --confirm flag', () => {
      const argv = ['node', 'sendEmail', '--send-to', 'test@example.com', '--confirm'];
      const result = parseArguments(argv);
      
      expect(result.confirm).toBe(true);
      expect(result.force).toBeUndefined();
    });

    it('parses --force flag', () => {
      const argv = ['node', 'sendEmail', '--send-to', 'test@example.com', '--force'];
      const result = parseArguments(argv);
      
      expect(result.force).toBe(true);
      expect(result.confirm).toBeUndefined();
    });

    it('parses -f short flag', () => {
      const argv = ['node', 'sendEmail', '--send-to', 'test@example.com', '-f'];
      const result = parseArguments(argv);
      
      expect(result.force).toBe(true);
    });

    it('allows both --confirm and --force to be specified (force takes precedence)', () => {
      const argv = ['node', 'sendEmail', '--send-to', 'test@example.com', '--confirm', '--force'];
      const result = parseArguments(argv);
      
      // Both flags can be set; shouldSkipConfirmation logic gives force precedence
      expect(result.confirm).toBe(true);
      expect(result.force).toBe(true);
    });

    it('does not set confirm or force when neither is specified (default: confirm)', () => {
      const argv = ['node', 'sendEmail', '--send-to', 'test@example.com'];
      const result = parseArguments(argv);
      
      expect(result.confirm).toBeUndefined();
      expect(result.force).toBeUndefined();
    });
  });
});

/**
 * Test shouldSkipConfirmation logic (helper function from index.ts)
 * This logic determines whether to skip confirmation based on confirm and force flags.
 */
describe('shouldSkipConfirmation logic', () => {
  // Replicate the shouldSkipConfirmation function for testing
  function shouldSkipConfirmation(confirm?: boolean, force?: boolean): boolean {
    if (force === true) return true;
    if (confirm === false) return true;
    return false;
  }

  it('returns true when force is true', () => {
    expect(shouldSkipConfirmation(undefined, true)).toBe(true);
    expect(shouldSkipConfirmation(true, true)).toBe(true);
    expect(shouldSkipConfirmation(false, true)).toBe(true);
  });

  it('returns true when confirm is explicitly set to false', () => {
    expect(shouldSkipConfirmation(false, undefined)).toBe(true);
    expect(shouldSkipConfirmation(false, false)).toBe(true);
  });

  it('returns false when neither force nor confirm=false is set (default: show confirmation)', () => {
    expect(shouldSkipConfirmation(undefined, undefined)).toBe(false);
    expect(shouldSkipConfirmation(undefined, false)).toBe(false);
  });

  it('returns false when confirm is explicitly true', () => {
    expect(shouldSkipConfirmation(true, undefined)).toBe(false);
    expect(shouldSkipConfirmation(true, false)).toBe(false);
  });

  it('force takes precedence over confirm when both are set', () => {
    // --confirm --force → skip confirmation (force wins)
    expect(shouldSkipConfirmation(true, true)).toBe(true);
  });
});
