# sendEmail Engine API

Documentation for using the `EmailEngine` as a library in TypeScript/JavaScript projects.

The engine is interface-agnostic and can be embedded in VS Code extensions, GUI applications, web APIs, or any Node.js application.

> **Note:** Terminal Mode (`--command-format`) is a CLI-argument pre-processor and does not apply when using `EmailEngine` directly as a library. See [TERMINAL-FORMAT.md](TERMINAL-FORMAT.md) for CLI usage.

`Ctrl + click` to view [docs](https://isocialpractice.github.io/sendEmail/index.html?api)

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
  logsPath: string;        // logs/
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

#### `loadGlobalAttachmentsFromFile(configFilePath: string): Promise<Attachment[]>`

Load global attachments from an explicit resolved file path. Path and asset resolution are the responsibility of the caller.

```typescript
const atts = await engine.loadGlobalAttachmentsFromFile('/absolute/path/to/global.js');
```

---

#### `resolveGlobalFolder(globalName: string): Promise<GlobalDataResolution>`

Resolve the full structure of a global folder. Supports nested paths (e.g. `'footer/billing'`).

Returns a `GlobalDataResolution` describing the paths to `global.js`, HTML data file, and text data file.

```typescript
const resolution = await engine.resolveGlobalFolder('footer');
// resolution.configFilePath  → path to global.js
// resolution.htmlDataPath    → path to html.htm / html/<file>
// resolution.textDataPath    → path to text.txt / data/<file>
// resolution.htmlDataType    → 'global:data:html' | 'global:data:folder:html'
// resolution.textDataType    → 'global:data:text' | 'global:data:folder:data'

// Nested global:
const nested = await engine.resolveGlobalFolder('footer/billing');
```

---

#### `loadGlobalForInline(globalName: string): Promise<{ html?, text?, attachments, assetBasePath }>`

Load a global's data content (HTML and/or text) and its attachment list. Follows the same 3-step resolution order as `--global-config` (CWD copy-location → root → CWD directory).

Attachment paths are returned **raw** (not resolved). Use `AttachmentLoader.resolveAttachmentsFromBase(attachments, assetBasePath)` to resolve them from the correct root.

```typescript
const { html, text, attachments, assetBasePath } = await engine.loadGlobalForInline('footer');
console.log(html);          // rendered HTML from html.htm or html/<file>
console.log(text);          // text from text.txt or data/<file>
console.log(attachments);   // raw attachment list from global.js
console.log(assetBasePath); // root to resolve attachment paths from
```

---

#### `buildMessage(emailConfig, templateVars, overrides?): Promise<EmailMessage>`

Build a complete, ready-to-send email message from configuration and template variables.

**Global tag processing**: if the loaded HTML or text content contains:

<!-- {% raw %} -->
```html
{% global 'name' %}
```
<!-- {% endraw %} -->

tags, `buildMessage()` automatically resolves each referenced global, substitutes the tag with the global's data file content, and merges the global's attachments. See [TEMPLATING.md](TEMPLATING.md) for full details.

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
  log?: boolean | string;     // Log sent email to logs/ (true | "true" enables logging)
}
```

### `GlobalDataResolution`

Returned by `resolveGlobalFolder()`. Describes all discovered files within a global folder.

```typescript
interface GlobalDataResolution {
  name: string;              // The global name used for lookup, e.g. 'footer' or 'footer/billing'
  folderPath: string;        // Absolute path to the global folder
  /**
   * Root directory used for resolving attachment paths from global.js.
   * - CWD   when the global was found in a --copy instance (CWD/config/globals/) or CWD directory
   * - rootPath when the global was found in the installed sendEmail root (ROOT/config/globals/)
   */
  assetBasePath: string;
  configFilePath?: string;   // Absolute path to global.js, if present
  htmlDataPath?: string;     // Absolute path to HTML data file, if present
  textDataPath?: string;     // Absolute path to text data file, if present
  htmlDataType?:             // Where the HTML data was found
    | 'global:data:html'         // root-level html.htm[l]
    | 'global:data:folder:html'; // html/ subfolder
  textDataType?:             // Where the text data was found
    | 'global:data:text'         // root-level text.txt
    | 'global:data:folder:data'; // data/ subfolder
}
```

---

### Configuration Type System

Every item in `config/` is classified by a `ConfigItemType`. Full reference in [TYPES.md](TYPES.md).

```typescript
type ConfigCategory = 'accounts' | 'globals' | 'emails' | 'support';

type AccountConfigType = 'account' | 'account:default' | 'account:named';

type GlobalConfigType =
  | 'global' | 'global:nested' | 'global:configuration'
  | 'global:data:html' | 'global:data:text'
  | 'global:data:folder' | 'global:data:folder:html' | 'global:data:folder:data';

type EmailConfigType =
  | 'email' | 'email:nested'
  | 'email:configuration:js' | 'email:configuration:json'
  | 'email:data:folder' | 'email:data:folder:html' | 'email:data:folder:data'
  | 'email:data:html' | 'email:data:text'
  | 'email:message:file:html' | 'email:message:file:text';

// Support types — root-level support folders (img/, attachments/)
type SupportConfigType = 'support' | 'support <img>' | 'support <attachment>';

type ConfigItemType = AccountConfigType | GlobalConfigType | EmailConfigType | SupportConfigType;
```

---

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

## Date Formatting Utilities

The engine includes date formatting utilities powered by [`@jhauga/getdate`](https://github.com/jhauga/getDate). These provide `{{dates.*}}` template variables automatically available in all email templates.

### `buildDatesVars()`

Build all `dates.*` template variables. Called automatically by the template engine when building email messages.

```typescript
import { buildDatesVars } from 'send-email/dist/utils/dates-helper.js';

const datesVars = buildDatesVars();
console.log(datesVars['dates.lastMonth']);  // "January" (in February)
console.log(datesVars['dates.quarter']);    // 1
console.log(datesVars['dates.year']);       // "2026"
```

### Available dates.* Variables

| Variable | Type | Description |
|---|---|---|
| `dates.date` | `string` | MM-DD-YY format |
| `dates.fullDate` | `string` | MM-DD-YYYY format |
| `dates.slashDate` | `string` | MM/DD/YY format |
| `dates.terminalDate` | `string` | MM/DD/YYYY format |
| `dates.isoDate` | `string` | YYYY-MM-DD format |
| `dates.day` | `string` | Day of month (two digits) |
| `dates.monthNumber` | `string` | Month number (two digits) |
| `dates.month` | `string` | Full month name |
| `dates.monthShort` | `string` | Abbreviated month name |
| `dates.lastMonth` | `string` | Full previous month name |
| `dates.lastMonthShort` | `string` | Abbreviated previous month name |
| `dates.quarter` | `number` | Current fiscal quarter (1-4) |
| `dates.lastQuarter` | `number` | Previous fiscal quarter (1-4) |
| `dates.season` | `string` | Current season name |
| `dates.year` | `string` | Four-digit current year |
| `dates.twoDigitYear` | `string` | Two-digit year |
| `dates.lastYear` | `string` | Four-digit previous year |
| `dates.nextYear` | `string` | Four-digit next year |
| `dates.isLeapYear` | `number` | Leap year indicator (1 or 0) |

### Usage in email.json

Template variables work in `subject`, `to`, `cc`, `bcc`, and `replyTo` fields:

```json
{
  "subject": "{{dates.lastMonth}} {{dates.year}} - Revenue Summary",
  "to": "reports@company.com"
}
```

When sent in February 2026, the subject becomes: `"January 2026 - Revenue Summary"`

See [TEMPLATING.md](TEMPLATING.md) for full template variable documentation.

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
