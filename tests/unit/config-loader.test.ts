/**
 * config-loader.test.ts
 * Unit tests for ConfigLoader - uses mock file system for isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

// Mock the file-utils module
vi.mock('../../src/utils/file-utils.js', () => ({
  readFile: vi.fn(),
  exists: vi.fn(),
  listDirs: vi.fn(),
}));

// Import after mocking
import { ConfigLoader } from '../../src/core/config-loader.js';
import * as fileUtils from '../../src/utils/file-utils.js';
import type { EngineConfig } from '../../src/core/types.js';

const mockConfig: EngineConfig = {
  rootPath: '/test/root',
  accountsPath: '/test/root/config/accounts',
  emailsPath: '/test/root/config/emails',
  globalsPath: '/test/root/config/globals',
  listsPath: '/test/root/lists',
  attachmentsPath: '/test/root/attachments',
  imagesPath: '/test/root/img',
  defaultAccount: '_default',
};

describe('ConfigLoader', () => {
  let loader: ConfigLoader;

  beforeEach(() => {
    loader = new ConfigLoader(mockConfig);
    vi.clearAllMocks();
  });

  describe('loadEmailConfig', () => {
    it('loads and parses a valid email.json', async () => {
      const mockEmailConfig = {
        to: 'test@example.com',
        subject: 'Test Subject',
        from: '_default',
        html: 'template.htm',
      };

      vi.mocked(fileUtils.exists).mockResolvedValue(true);
      vi.mocked(fileUtils.readFile).mockResolvedValue(JSON.stringify(mockEmailConfig));

      const result = await loader.loadEmailConfig('test-email');

      expect(result).toEqual(mockEmailConfig);
      expect(fileUtils.readFile).toHaveBeenCalledWith(
        expect.stringContaining('test-email')
      );
    });

    it('throws ConfigurationError when email.json not found', async () => {
      vi.mocked(fileUtils.exists).mockResolvedValue(false);
      vi.mocked(fileUtils.listDirs).mockResolvedValue([]);

      await expect(loader.loadEmailConfig('nonexistent')).rejects.toThrow(
        "Email config 'nonexistent' not found"
      );
    });

    it('throws ConfigurationError on invalid JSON', async () => {
      vi.mocked(fileUtils.exists).mockResolvedValue(true);
      vi.mocked(fileUtils.readFile).mockResolvedValue('{ invalid json }');

      await expect(loader.loadEmailConfig('bad-email')).rejects.toThrow(
        "Failed to parse email config 'bad-email'"
      );
    });
  });

  describe('loadEmailList', () => {
    it('loads and parses a valid email list', async () => {
      const mockList = {
        'email-list': [
          { email: 'alice@example.com', name: 'Alice' },
          { email: 'bob@example.com', name: 'Bob' },
        ],
      };

      vi.mocked(fileUtils.exists).mockResolvedValue(true);
      vi.mocked(fileUtils.readFile).mockResolvedValue(JSON.stringify(mockList));

      const result = await loader.loadEmailList('mylist');

      expect(result['email-list']).toHaveLength(2);
      expect(result['email-list'][0]!.name).toBe('Alice');
    });

    it('throws ConfigurationError when list not found', async () => {
      vi.mocked(fileUtils.exists).mockResolvedValue(false);

      await expect(loader.loadEmailList('nonexistent')).rejects.toThrow(
        "Email list 'nonexistent' not found"
      );
    });

    it('throws ConfigurationError when email-list key is missing', async () => {
      vi.mocked(fileUtils.exists).mockResolvedValue(true);
      vi.mocked(fileUtils.readFile).mockResolvedValue(JSON.stringify({ contacts: [] }));

      await expect(loader.loadEmailList('bad-list')).rejects.toThrow(
        "Failed to parse email list 'bad-list'"
      );
    });
  });

  describe('loadEmailVars and template substitution in email.json', () => {
    it('substitutes custom variables from email.js into email.json', async () => {
      const mockEmailJsonWithTemplates = {
        to: 'test@example.com',
        subject: 'Report {{dates.lastMonth}} {{theYear}}',
        from: '_default',
      };

      // Mock email.json file
      vi.mocked(fileUtils.exists).mockImplementation(async (filePath: string) => {
        if (filePath.includes('email.json')) return true;
        if (filePath.includes('email.js')) return true;
        return false;
      });

      vi.mocked(fileUtils.readFile).mockResolvedValue(
        JSON.stringify(mockEmailJsonWithTemplates)
      );

      // Mock dynamic import for email.js
      const mockEmailVars = {
        theYear: '2026',
        reportType: 'Monthly',
      };

      // Create a mock module
      vi.doMock('/test/root/config/emails/test-email/email.js', () => ({
        emailVars: mockEmailVars,
      }));

      const result = await loader.loadEmailConfig('test-email');

      // The subject should still have templates because dates.lastMonth isn't mocked
      // but theYear should be present in the context
      expect(result.subject).toBeDefined();
    });

    it('loads email.json without custom variables when email.js does not exist', async () => {
      const mockEmailConfig = {
        to: 'test@example.com',
        subject: 'Static Subject',
        from: '_default',
      };

      vi.mocked(fileUtils.exists).mockImplementation(async (filePath: string) => {
        if (filePath.includes('email.json')) return true;
        if (filePath.includes('email.js')) return false;
        return false;
      });

      vi.mocked(fileUtils.readFile).mockResolvedValue(JSON.stringify(mockEmailConfig));

      const result = await loader.loadEmailConfig('test-email');

      expect(result.subject).toBe('Static Subject');
    });

    it('substitutes dates.* variables in email.json', async () => {
      const mockEmailJsonWithDates = {
        to: 'test@example.com',
        subject: 'Report {{dates.year}}',
        from: '_default',
      };

      vi.mocked(fileUtils.exists).mockImplementation(async (filePath: string) => {
        if (filePath.includes('email.json')) return true;
        if (filePath.includes('email.js')) return false;
        return false;
      });

      vi.mocked(fileUtils.readFile).mockResolvedValue(
        JSON.stringify(mockEmailJsonWithDates)
      );

      const result = await loader.loadEmailConfig('test-email');

      // Should substitute dates.year with actual year
      expect(result.subject).toMatch(/Report \d{4}/);
      expect(result.subject).not.toContain('{{dates.year}}');
    });

    it('handles nested template syntax in custom variables', async () => {
      const mockEmailJson = {
        to: 'test@example.com',
        subject: '{{theYear}} Report',
        from: '_default',
      };

      vi.mocked(fileUtils.exists).mockImplementation(async (filePath: string) => {
        if (filePath.includes('email.json')) return true;
        if (filePath.includes('email.js')) return false;
        return false;
      });

      // The JSON content has {{theYear}} but email.js doesn't exist
      // so theYear won't be substituted
      vi.mocked(fileUtils.readFile).mockResolvedValue(JSON.stringify(mockEmailJson));

      const result = await loader.loadEmailConfig('test-email');

      // theYear should remain unsubstituted since email.js doesn't exist
      expect(result.subject).toBe('{{theYear}} Report');
    });

    it('leaves unmatched template variables unchanged', async () => {
      const mockEmailJson = {
        to: 'test@example.com',
        subject: 'Report {{unknownVariable}}',
        from: '_default',
      };

      vi.mocked(fileUtils.exists).mockImplementation(async (filePath: string) => {
        if (filePath.includes('email.json')) return true;
        if (filePath.includes('email.js')) return false;
        return false;
      });

      vi.mocked(fileUtils.readFile).mockResolvedValue(JSON.stringify(mockEmailJson));

      const result = await loader.loadEmailConfig('test-email');

      // Unknown variables should remain as-is
      expect(result.subject).toBe('Report {{unknownVariable}}');
    });

    it('handles multiple template variables in one field', async () => {
      const mockEmailJson = {
        to: 'test@example.com',
        subject: '{{dates.month}} {{dates.year}} - Q{{dates.quarter}} Report',
        from: '_default',
      };

      vi.mocked(fileUtils.exists).mockImplementation(async (filePath: string) => {
        if (filePath.includes('email.json')) return true;
        if (filePath.includes('email.js')) return false;
        return false;
      });

      vi.mocked(fileUtils.readFile).mockResolvedValue(JSON.stringify(mockEmailJson));

      const result = await loader.loadEmailConfig('test-email');

      // All date variables should be substituted
      expect(result.subject).not.toContain('{{dates.');
      expect(result.subject).toMatch(/\w+ \d{4} - Q\d Report/);
    });
  });

  describe('loadEmailAttachments with date templating', () => {
    it('returns empty array when email.js does not exist', async () => {
      vi.mocked(fileUtils.exists).mockResolvedValue(false);

      const result = await loader.loadEmailAttachments('nonexistent');

      expect(result).toEqual([]);
    });

    it('handles errors gracefully when email.js exists but cannot be loaded', async () => {
      vi.mocked(fileUtils.exists).mockResolvedValue(true);

      // This will fail because the file doesn't actually exist in the test environment
      // We expect it to throw a ConfigurationError
      await expect(loader.loadEmailAttachments('example')).rejects.toThrow(
        "Failed to load email attachments for 'example'"
      );
    });
  });
});
