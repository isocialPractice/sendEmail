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
});
