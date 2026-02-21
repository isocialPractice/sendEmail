# sendEmail Engine API

Documentation for using the `EmailEngine` as a library in TypeScript/JavaScript projects.

The engine is interface-agnostic and can be embedded in VS Code extensions, GUI applications, web APIs, or any Node.js application.

---

## Installation

```bash
npm install
npm run build
```

Import the engine:

```typescript
import { EmailEngine, createEngineConfig } from './dist/core/engine.js';
```

---

## Quick Start

```typescript
import { EmailEngine, createEngineConfig } from './dist/core/engine.js';

// Create engine with default config (paths relative to CWD)
const config = createEngineConfig(process.cwd());
const engine = new EmailEngine(config);

// Initialize with the default account
await engine.initialize();

// Send a single email
const result = await engine.sendEmail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello from sendEmail Engine',
  html: '<p>Hello, World!</p>',
});

console.log(result.success, result.messageId);
```

---

## `createEngineConfig(rootPath)`

Creates an `EngineConfig` with all paths resolved relative to `rootPath`.

```typescript
function createEngineConfig(rootPath: string): EngineConfig;
```

### EngineConfig

```typescript
interface EngineConfig {
  rootPath: string;        // Root directory of sendEmail instance
  accountsPath: string;    // config/accounts/
  emailsPath: string;      // config/emails/
  globalsPath: string;     // config/globals/
  listsPath: string;       // lists/
  attachmentsPath: string; // attachments/
  imagesPath: string;      // img/
  defaultAccount: string;  // '_default'
}
```

---

## `EmailEngine`

### Constructor

```typescript
new EmailEngine(config: EngineConfig)
```

### Methods

#### `initialize(accountName?: string): Promise<void>`

Initialize the engine with an email account. Must be called before sending.

```typescript
await engine.initialize();               // Uses _default account
await engine.initialize('myaccount');    // Uses config/accounts/myaccount.js
```

---

#### `loadEmailConfig(emailName: string): Promise<EmailConfig>`

Load a configured email template from `config/emails/<emailName>/email.json`.

```typescript
const config = await engine.loadEmailConfig('billing');
// { to: 'CHANGE_SEND_TO', subject: 'Billing Statement', html: 'template.htm', ... }
```

---

#### `loadEmailList(listName: string): Promise<EmailList>`

Load an email list from `lists/<listName>.json`.

```typescript
const list = await engine.loadEmailList('subscribers');
// { 'email-list': [{ email: '...', name: '...' }, ...] }
```

---

#### `buildMessage(emailConfig, templateVars, overrides?): Promise<EmailMessage>`

Build a complete, ready-to-send email message from configuration and template variables.

```typescript
const message = await engine.buildMessage(
  emailConfig,
  { 'contact.name': 'John', 'contact.email': 'john@example.com' },
  { to: 'john@example.com', subject: 'Custom Subject' }
);
```

---

#### `sendEmail(message: EmailMessage): Promise<SendResult>`

Send a single email message.

```typescript
const result = await engine.sendEmail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello',
  html: '<p>Hello!</p>',
});

// result.success: boolean
// result.messageId: string
// result.recipient: string
// result.error: Error (if failed)
```

---

#### `sendBulk(emailConfig, emailList, overrides?, onProgress?): Promise<BulkSendResult>`

Send emails to an entire email list (repetitive mode). Calls `onProgress` after each send.

```typescript
const result = await engine.sendBulk(
  emailConfig,
  emailList,
  { bcc: 'archive@company.com' },
  (current, total, sendResult) => {
    console.log(`Sent ${current}/${total}: ${sendResult.recipient}`);
  }
);

// result.total: number
// result.successful: number
// result.failed: number
// result.results: SendResult[]
```

---

#### `preview(emailConfig, templateVars, overrides?): Promise<EmailMessage>`

Build and return the email message without sending. Useful for previewing.

```typescript
const preview = await engine.preview(emailConfig, vars);
console.log(preview.html); // Rendered HTML
```

---

#### `verifyConnection(): Promise<boolean>`

Verify SMTP connectivity without sending an email.

```typescript
const ok = await engine.verifyConnection();
if (!ok) console.error('SMTP connection failed');
```

---

## Types

### `AccountConfig`

```typescript
interface AccountConfig {
  service?: string;   // 'gmail', 'outlook', etc.
  host?: string;      // Custom SMTP host
  port?: number;      // Custom SMTP port
  secure?: boolean;   // true = TLS (port 465), false = STARTTLS
  auth: {
    user: string;
    pass: string;
  };
}
```

### `EmailConfig`

```typescript
interface EmailConfig {
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;              // Account name or email address
  replyTo?: string | string[];
  subject?: string;
  html?: string | string[];   // HTML file reference(s)
  text?: string;
  attachments?: string;
  globals?: string[];         // Global template names
  dsn?: DsnConfig;
  sendAll?: boolean;          // Send one email to all contacts on the list
  emailList?: string;         // List file name from lists/
  'email-list'?: EmailContact[]; // Inline contact list
}
```

### `SendResult`

```typescript
interface SendResult {
  success: boolean;
  messageId?: string;
  error?: Error;
  recipient?: string;
}
```

### `BulkSendResult`

```typescript
interface BulkSendResult {
  total: number;
  successful: number;
  failed: number;
  results: SendResult[];
}
```

---

## VS Code Extension Example

```typescript
import { EmailEngine, createEngineConfig } from 'send-email/dist/core/engine.js';
import * as vscode from 'vscode';

async function sendFromExtension(workspacePath: string) {
  const config = createEngineConfig(workspacePath);
  const engine = new EmailEngine(config);

  await engine.initialize();

  const emailConfig = await engine.loadEmailConfig('notification');
  const list = await engine.loadEmailList('team');

  const result = await engine.sendBulk(
    emailConfig,
    list,
    {},
    (current, total) => {
      vscode.window.setStatusBarMessage(`Sending ${current}/${total}...`);
    }
  );

  vscode.window.showInformationMessage(
    `Sent ${result.successful}/${result.total} emails.`
  );
}
```

---

## Error Handling

All engine methods throw typed errors:

```typescript
import {
  ConfigurationError,
  ValidationError,
  FileError,
  NetworkError,
  AuthenticationError,
} from 'send-email/dist/utils/error-handler.js';

try {
  await engine.initialize('bad-account');
} catch (err) {
  if (err instanceof ConfigurationError) {
    console.error('Config error:', err.message);
    console.error('Details:', err.details);
    console.error('Suggestion:', err.suggestion);
  }
}
```
