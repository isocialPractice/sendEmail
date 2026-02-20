/**
 * engine-smtp.test.ts
 * Integration tests for EmailEngine using the mock SMTP server.
 * All sends go through MockSmtpServer on 127.0.0.1:2525.
 * accountsPath is pointed at tests/mock/accounts/ - no data from config/accounts/ is used.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmailEngine } from '../../src/core/engine.js';
import { MockSmtpServer } from '../mock/server/smtp-server.js';
import type { EngineConfig } from '../../src/core/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..', '..');

/** Engine config wired to mock accounts - never touches config/accounts/ */
const testEngineConfig: EngineConfig = {
  rootPath: ROOT,
  accountsPath: path.resolve(__dirname, '..', 'mock', 'accounts'),
  emailsPath: path.resolve(ROOT, 'config', 'emails'),
  globalsPath: path.resolve(ROOT, 'config', 'globals'),
  listsPath: path.resolve(ROOT, 'lists'),
  attachmentsPath: path.resolve(ROOT, 'attachments'),
  imagesPath: path.resolve(ROOT, 'img'),
  defaultAccount: '_default',
};

describe('EmailEngine (SMTP integration)', () => {
  let smtpServer: MockSmtpServer;
  let engine: EmailEngine;

  beforeAll(async () => {
    smtpServer = new MockSmtpServer({ port: 2525 });
    await smtpServer.start();
  });

  afterAll(async () => {
    await smtpServer.stop();
  });

  beforeEach(async () => {
    smtpServer.clear();
    engine = new EmailEngine(testEngineConfig);
    await engine.initialize('_default');
  });

  it('mock accountsPath does not reference config/accounts', () => {
    const realAccountsPath = path.resolve(ROOT, 'config', 'accounts');
    expect(testEngineConfig.accountsPath).not.toBe(realAccountsPath);
    expect(testEngineConfig.accountsPath).toContain(path.join('mock', 'accounts'));
  });

  it('sends a plain text email and captures it on the mock server', async () => {
    const result = await engine.sendEmail({
      from: 'test@localhost.test',
      to: 'recipient@example.com',
      subject: 'Plain text test',
      text: 'Hello from the test suite.',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeTruthy();
    expect(result.recipient).toBe('recipient@example.com');
    expect(smtpServer.emails).toHaveLength(1);
    expect(smtpServer.emails[0]!.subject).toContain('Plain text test');
    expect(smtpServer.emails[0]!.to).toContain('recipient@example.com');
  });

  it('sends an HTML email via mock SMTP server', async () => {
    const result = await engine.sendEmail({
      from: 'test@localhost.test',
      to: 'html-user@example.com',
      subject: 'HTML email test',
      html: '<h1>Hello</h1><p>Integration test email.</p>',
    });

    expect(result.success).toBe(true);
    expect(smtpServer.emails).toHaveLength(1);
    expect(smtpServer.emails[0]!.to).toContain('html-user@example.com');
  });

  it('resolves from address from the mock account', () => {
    const from = engine.getAccountEmail();
    expect(from).toBe('test@localhost.test');
  });

  it('sends bulk emails to all contacts in a list', async () => {
    const emailList = {
      'email-list': [
        { email: 'alice@example.com', name: 'Alice' },
        { email: 'bob@example.com', name: 'Bob' },
      ],
    };

    const emailConfig = {
      from: 'test@localhost.test',
      subject: 'Bulk test for {{contact.name}}',
      text: 'Hi {{contact.name}}, this is your message.',
    };

    const bulkResult = await engine.sendBulk(emailConfig, emailList);

    expect(bulkResult.total).toBe(2);
    expect(bulkResult.successful).toBe(2);
    expect(bulkResult.failed).toBe(0);
    expect(smtpServer.emails).toHaveLength(2);
    expect(smtpServer.emails[0]!.to).toContain('alice@example.com');
    expect(smtpServer.emails[1]!.to).toContain('bob@example.com');
  });

  it('mock server captures emails independently per test (clear works)', async () => {
    // smtpServer.clear() is called in beforeEach - inbox should always start empty
    expect(smtpServer.emails).toHaveLength(0);

    await engine.sendEmail({
      from: 'test@localhost.test',
      to: 'solo@example.com',
      subject: 'Isolation check',
      text: 'Only one email this run.',
    });

    expect(smtpServer.emails).toHaveLength(1);
  });
});
