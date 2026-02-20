/**
 * validator.test.ts
 * Unit tests for input validation functions.
 */

import { describe, it, expect } from 'vitest';
import {
  validateEmailAddress,
  validateEmailAddresses,
  validateContentDisposition,
} from '../../src/core/validator.js';
import { ValidationError } from '../../src/utils/error-handler.js';

describe('validateEmailAddress', () => {
  it('accepts valid email addresses', () => {
    const valid = [
      'user@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.org',
      'firstname.lastname@company.com',
    ];
    valid.forEach(addr => {
      expect(() => validateEmailAddress(addr)).not.toThrow();
    });
  });

  it('rejects invalid email addresses', () => {
    const invalid = [
      'notanemail',
      'missing@',
      '@nodomain',
      '',
      'spaces in@email.com',
    ];
    invalid.forEach(addr => {
      expect(() => validateEmailAddress(addr)).toThrow(ValidationError);
    });
  });
});

describe('validateEmailAddresses', () => {
  it('validates an array of addresses', () => {
    expect(() =>
      validateEmailAddresses(['a@b.com', 'c@d.org'])
    ).not.toThrow();
  });

  it('throws if any address in array is invalid', () => {
    expect(() =>
      validateEmailAddresses(['valid@email.com', 'notvalid'])
    ).toThrow(ValidationError);
  });
});

describe('validateContentDisposition', () => {
  it('accepts "attachment"', () => {
    expect(() => validateContentDisposition('attachment')).not.toThrow();
  });

  it('accepts "inline"', () => {
    expect(() => validateContentDisposition('inline')).not.toThrow();
  });

  it('rejects other values', () => {
    expect(() => validateContentDisposition('embed')).toThrow(ValidationError);
    expect(() => validateContentDisposition('')).toThrow(ValidationError);
  });
});
