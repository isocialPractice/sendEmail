---
agent: 'agent'
description: 'Using the contents of the current workspace or codebase, restructure and make a command line tool using quasi-coder skill that will send emails as normally sent, and send repetitive emails. The final reformatted tool must utilize TypeScript. The tool should be engine-like, meaning it could be plugged into an API like that for VS Code extension with a GUI, a GUI library, a custom user-built GUI library, etc.'
tools: ['codebase', 'edit/editFiles', 'edit/createDirectory', 'edit/createFile', 'fetch', 'github', 'read', 'read/readFile', 'search', 'search/codebase', 'search/fileSearch', 'web', 'web/fetch', 'web/githubRepo']
---

# PROMPT DATA FOR `make-send-email-tool.prompt.md`

## Current Codebase Analysis

### Existing Structure Overview

The current `sendEmail` application is a Node.js-based email automation tool with the following architecture:

**Core Files:**
- sendEmail.js - Main application entry point (currently JavaScript with shorthand notation)
- send.js - Simplified send script with hardcoded credentials
- sendEmail.bat - Windows batch wrapper for CLI execution  
- send.bat - Windows batch wrapper for simplified send

**Configuration Structure:**
```
config/
├── accounts/          # Email account credentials & transporter configs
│   ├── _default.js   # REQUIRED default account
│   └── example.js    # Example account configuration
├── emails/           # Reusable email templates & configurations
│   ├── billing/
│   │   ├── email.js    # Attachment configurations
│   │   ├── email.json  # Email metadata & structure
│   │   └── html/
│   │       └── billingStatement.htm
│   └── example/
│       ├── email.js
│       ├── email.json
│       ├── data/       # Text/JSON data files for templating
│       └── html/       # HTML email templates
└── globals/          # Reusable global templates
    ├── example/
    │   └── global.js
    └── footer/
        └── global.js   # Common footer with logo/map
```

**Supporting Directories:**
- lists - Email list JSON files with contact information
- attachments - Files to be attached to emails
- img - Embedded images (using cid references)

### Current Data Models

#### Account Configuration Model (config/accounts/*.js)
```javascript
{
  transporter: nodemailer.createTransport({
    service: "gmail",  // or "smtp"
    auth: {
      user: "email@example.com",
      pass: "password"  // or app-specific password
    }
  })
}
```

#### Email Configuration Model (config/emails/*/email.json)
```json
{
  "to": "CHANGE_SEND_TO",           // Can be overridden by CLI
  "bcc": "CHANGE_BCC",              // Optional
  "from": "accountName",            // References account config
  "replyTo": "accountName",         // Defaults to from address  
  "subject": "Email Subject",       // Can include template vars
  "html": ["html_a", "html_b"],    // Array of HTML file refs
  "attachments": "emailAttachments", // Refs to email.js exports
  "dsn": {                          // Delivery Status Notification
    "id": "DSN_ID",
    "return": "headers",
    "notify": ["success", "delay"],
    "recipient": "accountName"
  }
}
```

#### Email Attachments Model (config/emails/*/email.js)
```javascript
export var emailAttachments = [
  {
    filename: 'document.pdf',
    path: 'attachments/document.pdf'
  },
  {
    filename: 'logo.jpg',
    path: 'img/logo.jpg',
    contentDisposition: "inline",  // For embedded images
    cid: "logo@example.com"       // Content ID for <img src="cid:...">
  }
];
```

#### Global Attachments Model (config/globals/*/global.js)
```javascript
export var globalAttachments = [
  {
    filename: 'Logo',
    path: 'img/logo.jpg',
    contentDisposition: "inline",
    cid: "logo@example.com"
  }
];
```

#### Email List Model (lists/*.json)
```json
{
  "email-list": [
    {
      "email": "john@example.com",
      "name": "John Doe"
    },
    {
      "email": "jane@example.com",
      "name": "Jane Doe"
    }
  ]
}
```

**Extended Email List Model** (for future use):
```json
{
  "email-list": [
    {
      "email": "john@example.com",       // REQUIRED
      "name": "John Doe",                // REQUIRED
      "company": "Acme Corp",            // OPTIONAL
      "phone": "(555) 555-1234",         // OPTIONAL
      "customField": "customValue"       // OPTIONAL - any additional fields
    }
  ]
}
```

### Current Features & Behavior

**Implemented:**
1. ✅ Basic email sending with nodemailer
2. ✅ Account configuration system (config/accounts/)
3. ✅ Email template system (config/emails/)
4. ✅ Global reusable templates (config/globals/)
5. ✅ HTML email support with inline images (cid references)
6. ✅ Attachment support
7. ✅ Email list structure (lists/*.json)
8. ✅ BCC support
9. ✅ Custom from/replyTo addresses

**Partially Implemented (shorthand/quasi-code):**
1. 🟡 Command-line options parsing
2. 🟡 Email list iteration for bulk sending
3. 🟡 Template variable replacement (e.g., `CH-EMAILONLIST`, `CHANGE_SEND_TO`)
4. 🟡 Dynamic attachment loading from global.js
5. 🟡 Multiple HTML file concatenation

**Not Implemented:**
1. ❌ TypeScript support
2. ❌ CLI argument parsing framework
3. ❌ Email list tool files (`__sendEmail__*-names.txt`, `__sendEmail__*-emails.txt`)
4. ❌ `--new-list` list generation functionality
5. ❌ Test framework (`--test` option)
6. ❌ Copy functionality (`-c, --copy` option)
7. ❌ Help documentation system (`-h, --help` option)
8. ❌ Validation and error handling
9. ❌ Markdown to HTML conversion for message files
10. ❌ Template variable substitution engine
11. ❌ Confirmation prompts (`-f, --force` bypass)
12. ❌ Logging system

---

## TypeScript Architecture Specification

### Core Architecture Principles

The refactored tool must be **engine-like** and **modular**:

1. **Separation of Concerns**: Core email engine separate from CLI interface
2. **Pluggable Interface**: Engine can be used by CLI, API, GUI, VS Code extension
3. **Type Safety**: Full TypeScript with strict mode enabled
4. **Dependency Injection**: Configuration and dependencies injected, not hardcoded
5. **Testable**: Pure functions and mockable dependencies
6. **Extensible**: Easy to add new features, templates, and integrations

### Recommended Project Structure

```
sendEmail/
├── src/
│   ├── core/                    # Core email engine (interface-agnostic)
│   │   ├── engine.ts           # Main EmailEngine class
│   │   ├── types.ts            # All TypeScript interfaces & types
│   │   ├── config-loader.ts    # Load & validate configurations
│   │   ├── template-engine.ts  # Template variable substitution
│   │   ├── list-processor.ts   # Email list iteration & processing
│   │   ├── attachment-loader.ts # Load attachments from configs
│   │   └── validator.ts        # Input validation
│   ├── cli/                     # CLI-specific code
│   │   ├── index.ts            # CLI entry point
│   │   ├── parser.ts           # Command-line argument parsing
│   │   ├── prompts.ts          # User confirmation prompts
│   │   └── help.ts             # Help documentation generator
│   ├── utils/                   # Shared utilities
│   │   ├── file-utils.ts       # File reading/writing
│   │   ├── logger.ts           # Logging system
│   │   ├── markdown-html.ts    # Lightweight MD -> HTML converter
│   │   └── error-handler.ts    # Error handling & formatting
│   └── tools/                   # Tool scripts (list generation, etc.)
│       ├── list-generator.ts   # Generate email lists from tool files
│       ├── copy-tool.ts        # Copy sendEmail to another location
│       └── test-runner.ts      # Test framework runner
├── dist/                        # Compiled JavaScript (not tracked in git)
├── config/                      # Same structure as current
├── lists/                       # Same structure as current
├── attachments/                 # Same structure as current
├── img/                         # Same structure as current
├── docs/                        # Documentation
│   ├── API.md                  # Engine API documentation
│   ├── CLI-OPTIONS.md          # Comprehensive CLI options guide
│   ├── CLI-CHEATSHEET.md       # Quick reference for CLI
│   └── EXAMPLES.md             # Real-world usage examples
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── mock/                   # Mock data & servers
├── package.json
├── tsconfig.json
└── README.md
```

### TypeScript Type Definitions

```typescript
// src/core/types.ts

/**
 * Email sending modes
 */
export enum SendMode {
  RAW = 'raw',           // Quick raw text email
  NORMAL = 'normal',     // Structured email with options
  REPETITIVE = 'repetitive'  // Bulk send with email lists
}

/**
 * Account configuration from config/accounts/*.js
 */
export interface AccountConfig {
  service: string;          // 'gmail', 'smtp', etc.
  auth: {
    user: string;
    pass: string;
  };
  host?: string;            // For custom SMTP
  port?: number;            // For custom SMTP
  secure?: boolean;         // For custom SMTP
}

/**
 * Email attachment configuration
 */
export interface Attachment {
  filename: string;
  path: string;
  contentDisposition?: 'attachment' | 'inline';
  cid?: string;             // Content ID for inline images
}

/**
 * Email configuration from config/emails/*/email.json
 */
export interface EmailConfig {
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  replyTo?: string;
  subject: string;
  html?: string | string[];  // File reference(s)
  text?: string;             // File reference
  attachments?: string;      // Reference to email.js export
  dsn?: {
    id: string;
    return: 'headers' | 'full';
    notify: Array<'success' | 'failure' | 'delay'>;
    recipient: string;
  };
}

/**
 * Email list contact entry
 */
export interface EmailContact {
  email: string;              // REQUIRED
  name: string;               // REQUIRED
  [key: string]: any;         // Additional optional fields
}

/**
 * Email list structure
 */
export interface EmailList {
  'email-list': EmailContact[];
}

/**
 * Template variables for substitution
 */
export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

/**
 * Email message to be sent (nodemailer compatible)
 */
export interface EmailMessage {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Attachment[];
  dsn?: {
    id: string;
    return: string;
    notify: string[];
    recipient: string;
  };
}

/**
 * CLI options parsed from command line
 */
export interface CLIOptions {
  // Account & Config
  account?: string;              // --account [name]
  configEmail?: string;          // --config-email [name]
  
  // Sending Options
  sendTo?: string | string[];    // --send-to [address]
  subject?: string;              // --subject [text]
  messageFile?: string;          // --message-file [path]
  messageHtml?: string;          // --message-html [path]
  messageText?: string;          // --message-text [path]
  fromAddress?: string;          // --from-address [email]
  replyTo?: string;              // --reply-to [email]
  cc?: string | string[];        // --cc [address]
  bcc?: string | string[];       // --bcc [address]
  
  // Attachment Options
  attachFile?: string[];         // --attach-file [filename]
  attachPath?: string[];         // --attach-path [path]
  attachCid?: string[];          // --attach-cid [cid]
  attachContentDisp?: string[];  // --attach-content-disp [inline|attachment]
  
  // List Options
  emailList?: string;            // Email list to use for repetitive sending
  
  // Tool Options
  newList?: string;              // --new-list [listName]
  listToolPath?: string;         // --list-tool-path [path]
  
  // Mode Options
  text?: string;                 // -t, --text [address] [message] (raw mode)
  force?: boolean;               // -f, --force (skip confirmation)
  copy?: string;                 // -c, --copy [path] (copy tool)
  help?: string;                 // -h, --help [section] (show help)
  test?: string;                 // --test [unitTest] (run tests)
  
  // Additional
  raw?: boolean;                 // Use raw mode
  mode?: SendMode;               // Determined mode
}

/**
 * Email engine configuration
 */
export interface EngineConfig {
  accountsPath: string;         // Path to config/accounts/
  emailsPath: string;           // Path to config/emails/
  globalsPath: string;          // Path to config/globals/
  listsPath: string;            // Path to lists/
  attachmentsPath: string;      // Path to attachments/
  imagesPath: string;           // Path to img/
  defaultAccount: string;       // Default account name (_default)
}

/**
 * Send result
 */
export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: Error;
  recipient?: string;
}

/**
 * Bulk send result
 */
export interface BulkSendResult {
  total: number;
  successful: number;
  failed: number;
  results: SendResult[];
}
```

### Core Email Engine API

```typescript
// src/core/engine.ts

import { AccountConfig, EmailConfig, EmailMessage, EmailList, 
         SendResult, BulkSendResult, EngineConfig } from './types';

/**
 * Core email engine - interface-agnostic email sending
 */
export class EmailEngine {
  private config: EngineConfig;
  private transporter: any; // nodemailer Transporter
  
  constructor(config: EngineConfig) {
    this.config = config;
  }
  
  /**
   * Load account configuration
   */
  async loadAccount(accountName: string): Promise<AccountConfig> {
    // Load from config/accounts/{accountName}.js
  }
  
  /**
   * Load email configuration
   */
  async loadEmailConfig(emailName: string): Promise<EmailConfig> {
    // Load from config/emails/{emailName}/email.json
  }
  
  /**
   * Load email list
   */
  async loadEmailList(listName: string): Promise<EmailList> {
    // Load from lists/{listName}.json
  }
  
  /**
   * Build email message from configuration and variables
   */
  async buildMessage(
    emailConfig: EmailConfig,
    templateVars: Record<string, any>
  ): Promise<EmailMessage> {
    // Load HTML/text files
    // Process template variables
    // Load attachments
    // Return complete EmailMessage
  }
  
  /**
   * Send a single email
   */
  async sendEmail(message: EmailMessage): Promise<SendResult> {
    // Use nodemailer to send
  }
  
  /**
   * Send emails to an entire list (repetitive mode)
   */
  async sendBulk(
    emailConfig: EmailConfig,
    emailList: EmailList,
    onProgress?: (current: number, total: number) => void
  ): Promise<BulkSendResult> {
    // Iterate through list
    // Build message for each contact using template vars
    // Send each email
    // Report progress via callback
  }
  
  /**
   * Generate preview of email without sending
   */
  async preview(
    emailConfig: EmailConfig,
    templateVars: Record<string, any>
  ): Promise<EmailMessage> {
    // Build message without sending
  }
}
```

---

## CLI Option Specifications

### Option Categories

**Non-configurable Options** (CLI-only, not in config files):
- `--account [accountName]` - Specify account from config/accounts/
- `--config-email [emailName]` - Use configured email from config/emails/
- `-c, --copy [path]` - Copy tool to specified path (or CWD if no path)
- `-h, --help [section]` - Show help documentation
- `-f, --force` - Skip confirmation prompt
- `--test [unitTest]` - Run tests
- `-t, --text [address] [message]` - Quick text email (raw mode)

**Configurable Options** (can be in config files OR CLI):
- `--send-to [address]` - Recipient address(es)
- `--cc [address]` - CC address(es)
- `--bcc [address]` - BCC address(es)
- `--from-address [email]` - From address (overrides account)
- `--reply-to [email]` - Reply-to address
- `--subject [text]` - Email subject
- `--message-file [path]` - Message file (.txt, .html, .htm, .md)
- `--message-html [path]` - HTML message file (explicit)
- `--message-text [path]` - Text message file (explicit)
- `--attach-file [filename]` - Attachment filename
- `--attach-path [path]` - Attachment path
- `--attach-cid [cid]` - Content ID for inline attachment
- `--attach-content-disp [inline|attachment]` - Content disposition

**Tool Options** (for list generation, etc.):
- `--new-list [listName]` - Create new email list from tool files
- `--list-tool-path [path]` - Path to tool files (default: CWD)

### Option Type System

Each option should have a type in the CLI parser:

```typescript
type OptionType = 
  | 'mixed'         // Can be string, array, or from config
  | 'normal'        // Triggers normal mode
  | 'raw'           // Triggers raw mode
  | 'repetitive'    // Triggers repetitive mode
  | 'null'          // Doesn't affect mode
  | 'null:reproductive'  // Produces reusable instances
  | 'null:productive'    // Documentation/maintenance
  | 'aggressive'    // Tool mode, disables sending
  | 'passive';      // Requires aggressive option
```

### CLI Option Parser Requirements

Use a robust CLI parsing library (e.g., `commander` or `yargs`) with:

1. **Type validation** - Ensure options receive correct types
2. **Mutually exclusive groups** - Some options can't be used together
3. **Required combinations** - Some options require others
4. **Default values** - Sensible defaults when options omitted
5. **Error messages** - Clear, helpful error messages for misuse

### Template Variable Replacement

Template variables in email content, subjects, and filenames should be replaced:

**Current Variables** (found in codebase):
- `CH-EMAILONLIST` → Contact name from email list
- `CHANGE_SEND_TO` → Recipient email address
- `CHANGE_BCC` → BCC addresses
- `CHANGE_MESSAGE_HEADER` → Email subject
- `CH-EMAILTEXT` → Email message content path
- `CH-FILENAME_1`, `CH-IMG_1`, etc. → Attachment filenames/paths

**Proposed Variable System**:
```
{{contact.name}}         → John Doe
{{contact.email}}        → john@example.com
{{contact.company}}      → Acme Corp
{{contact.*}}            → Any custom field from email list
{{date}}                 → 2026-02-19
{{date.formatted}}       → February 19, 2026
{{subject}}              → Email subject
{{from}}                 → From address
{{account.user}}         → Account username
{{list.index}}           → Current index in bulk send (0-based)
{{list.count}}           → Total count in email list
```

---

## Feature Implementation Priorities

### Phase 1: Core Engine (TypeScript Migration)
1. Set up TypeScript project (`tsconfig.json`, build process)
2. Define all types in `src/core/types.ts`
3. Implement `EmailEngine` class with basic send functionality
4. Implement `ConfigLoader` for loading accounts, emails, globals
5. Implement `TemplateEngine` for variable substitution
6. Implement `AttachmentLoader` for loading attachments
7. Basic error handling and validation

### Phase 2: CLI Foundation
1. Implement CLI argument parser (`src/cli/parser.ts`)
2. Implement help system (`src/cli/help.ts`)
3. Connect CLI to EmailEngine
4. Implement confirmation prompts (`src/cli/prompts.ts`)
5. Implement `--force` flag
6. Basic logging system

### Phase 3: List & Bulk Sending
1. Implement `ListProcessor` for email list iteration
2. Implement bulk sending in `EmailEngine`
3. Progress reporting for bulk sends
4. Implement `--new-list` tool file functionality
5. Tool file validation

### Phase 4: Advanced Features
1. Markdown to HTML conversion
2. Multiple HTML file concatenation
3. Global + Email attachment merging
4. DSN (Delivery Status Notification) support
5. Email preview generation

### Phase 5: Tools & Testing
1. Implement `--copy` tool functionality
2. Implement test framework (`--test` option)
3. Unit tests for core engine
4. Integration tests for CLI
5. Mock SMTP server for testing (smtp4dev)

### Phase 6: Documentation
1. Generate comprehensive CLI options guide
2. Create CLI cheatsheet
3. Write real-world usage examples
4. API documentation for engine
5. Migration guide from old version

---

## Dependency Recommendations

### Core Dependencies
```json
{
  "dependencies": {
    "nodemailer": "^6.9.0",          // Email sending
    "commander": "^11.1.0",          // CLI parsing (or yargs)
    "chalk": "^5.3.0",               // Colored terminal output
    "ora": "^8.0.0",                 // Spinners for progress
    "inquirer": "^9.2.0",            // User prompts
    "marked": "^11.0.0",             // Markdown to HTML (lightweight)
    "zod": "^3.22.0"                 // Runtime validation
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/nodemailer": "^6.4.0",
    "tsx": "^4.7.0",                 // TypeScript executor
    "vitest": "^1.1.0",              // Testing framework
    "smtp4dev": "^3.1.0"             // Mock SMTP server
  }
}
```

### Alternative CLI Parsers
- **commander** (recommended): Simpler, more intuitive API
- **yargs**: More powerful but complex
- **cac**: Lightweight alternative

---

## Real-World Usage Examples

### Example 1: Quick Text Email (Raw Mode)
```bash
sendEmail -t someone@example.com "Quick message here"
```

### Example 2: HTML Email with Options (Normal Mode)
```bash
sendEmail \
  --send-to john@example.com \
  --from-address jane@example.com \
  --subject "Monthly Report" \
  --message-html "./report.html" \
  --attach-file "report.pdf" \
  --attach-path "./attachments/report.pdf"
```

### Example 3: Configured Email (Normal Mode)
```bash
sendEmail \
  --config-email billing \
  --send-to client@example.com \
  --account production
```

### Example 4: Bulk Email from List (Repetitive Mode)
```bash
sendEmail \
  --config-email newsletter \
  --account marketing \
  --email-list subscribers \
  --force
```

### Example 5: Create Email List from Tool Files
```bash
# Tool files in CWD:
# __sendEmail__clients-names.txt
# __sendEmail__clients-emails.txt

sendEmail --new-list clients
# Creates lists/clients.json
```

### Example 6: Help Documentation
```bash
sendEmail -h                     # Full help
sendEmail -h options             # All options
sendEmail -h options:configurable # Just configurable options
sendEmail -h arguments           # All arguments
```

### Example 7: Copy Tool to Project
```bash
sendEmail --copy ./my-project
# Copies sendEmail to my-project/
# Excludes configured accounts (for security)
```

### Example 8: Run Tests
```bash
sendEmail --test                 # Run all tests
sendEmail --test send-basic      # Run specific unit test
```

---

## Migration Considerations

### Breaking Changes from Current Version
1. **Command syntax** - Options now use double-dash (`--send-to` instead of positional args)
2. **File extensions** - Account files must export transporter, not be self-executing
3. **JavaScript → TypeScript** - Config files may need updates for ESM/CJS compatibility
4. **Path resolution** - More strict about relative vs absolute paths

### Backwards Compatibility Strategy
1. **Legacy mode flag** - `--legacy` to use old syntax
2. **Migration tool** - Script to convert old configs to new format
3. **Warning messages** - Detect old patterns and suggest new syntax
4. **Dual config support** - Support both `.js` and `.ts` config files

### Security Improvements
1. **Never copy accounts** - `--copy` excludes config/accounts/
2. **Credential validation** - Check account configs before sending
3. **Sanitize inputs** - Prevent email header injection
4. **Rate limiting** - Delay between bulk emails to avoid spam flags

---

## Testing Strategy

### Unit Tests (vitest)
- ✅ ConfigLoader: Load accounts, emails, globals, lists
- ✅ TemplateEngine: Variable substitution
- ✅ AttachmentLoader: Load and validate attachments
- ✅ Validator: Input validation
- ✅ EmailEngine: Message building
- ✅ ListProcessor: Email list iteration

### Integration Tests
- ✅ CLI → Engine → Send (mock SMTP)
- ✅ Bulk sending with lists
- ✅ Template variable replacement in real emails
- ✅ Attachment loading from configs
- ✅ Multi-HTML file concatenation

### Mock SMTP Server (smtp4dev)
- Run local SMTP server for testing
- Capture sent emails without actually sending
- Verify email content, headers, attachments

### End-to-End Tests
- Test complete workflows from CLI to email sent
- Test error handling and recovery
- Test confirmation prompts and user interactions

---

## Error Handling Requirements

### Error Categories
1. **Configuration Errors** - Missing/invalid config files
2. **Validation Errors** - Invalid email addresses, missing required fields
3. **File Errors** - Missing template files, attachments, lists
4. **Network Errors** - SMTP connection failures, timeouts
5. **Authentication Errors** - Invalid credentials
6. **User Errors** - Invalid CLI syntax, conflicting options

### Error Message Format
```
[ERROR] Category: Descriptive message

Details:
  - Relevant detail 1
  - Relevant detail 2

Suggestion:
  Try running: sendEmail <correct command>
  
  For more help: sendEmail -h
```

### Example Error Messages
```
[ERROR] Configuration: Account '_default' not found

Details:
  - Expected file: config/accounts/_default.js
  - The default account is required for sendEmail to work

Suggestion:
  Create a default account configuration:
  cp config/accounts/example.js config/accounts/_default.js
  
  Then edit _default.js with your email credentials.
```

---

## Documentation Requirements

### CLI Options Guide (docs/CLI-OPTIONS.md)
- Comprehensive documentation for every option
- Description, type, default value, examples
- Mutually exclusive options
- Required combinations
- Real-world use cases

### CLI Cheatsheet (docs/CLI-CHEATSHEET.md)
- Quick reference table
- One-line descriptions
- Common usage patterns
- Option aliases

### API Documentation (docs/API.md)
- Full TypeScript API for EmailEngine
- Method signatures with examples
- Integration examples for VS Code extensions, GUIs, APIs
- Architecture diagrams

### Examples Documentation (docs/EXAMPLES.md)
- 20+ real-world usage examples
- Beginner, intermediate, advanced
- Common workflows (newsletters, billing, notifications)
- Troubleshooting guide

---

## Success Criteria

The refactored `sendEmail` tool is complete when:

1. ✅ **Fully TypeScript** - All code in `src/` is TypeScript with strict mode
2. ✅ **Engine-like** - Core engine can be imported and used in other applications
3. ✅ **CLI Functional** - All documented CLI options work correctly
4. ✅ **Bulk Sending** - Can send to email lists with template variables
5. ✅ **List Generation** - `--new-list` creates lists from tool files
6. ✅ **Tests Pass** - Unit and integration tests at 80%+ coverage
7. ✅ **Documentation Complete** - All 4 documentation files finished
8. ✅ **Error Handling** - Graceful errors with helpful messages
9. ✅ **Copy Tool** - Can copy tool to other projects
10. ✅ **Help System** - Comprehensive help with `sendEmail -h`

---

## Additional Notes from Prompt File Analysis

### Email Use Considerations (Future Features - Not Phase 1)
These are brainstormed features for future consideration, NOT for initial implementation:
- ⏭️ Task scheduling
- ⏭️ Calendar integration
- ⏭️ Auto-responders (out of office)
- ⏭️ Email templates for common scenarios (late notice, rescheduling, etc.)
- ⏭️ Newsletter management
- ⏭️ Data request/send workflows

### Email Templating Considerations
- ✅ HTML emails with inline CSS (no external stylesheets)
- ✅ Embedded images using cid references
- ✅ NO JavaScript in email content (will be stripped by email clients)
- ✅ Attachments from relative or absolute paths
- ✅ Path resolution relative to where command is called

### Organizing Repetitive Emails
- ✅ Category-based email organization in emails
- ✅ Filter by attachment types
- ✅ Reusable global templates
- ⏭️ (Future) Tag system for emails
- ⏭️ (Future) Search functionality for configured emails

### Web Resources to Reference
The prompt file includes extensive web resources to review:

**Nodemailer Documentation** (PRIMARY):
- https://community.nodemailer.com/
- OAuth2, SMTP setup, transporter setup
- Address formatting, attachments, embedded images
- Alternative content, custom headers, list headers
- Templating, bulk mail delivery
- Gmail-specific guidance

**Email Standards (RFC References)**:
- RFC 5322 (Email Structure)
- RFC 2045-2047, RFC 2231 (MIME)
- RFC 5321 (SMTP), RFC 3501 (IMAP)
- RFC 6376, RFC 8617 (Security - DKIM)

**Mock SMTP Server (Testing)**:
- smtp4dev for local testing
- mokapi.io for mock SMTP/IMAP

**Email Client Standards**:
- Fastmail email standards documentation

These resources should be consulted when implementing:
- Email sending logic
- Attachment handling
- Security features
- Testing infrastructure

### Fetching Data from the Web

Ensure that the prompt file includes instructions to fetch data from the web. Use these sites

#### Main Dependency

- #fetch https://community.nodemailer.com/
- #fetch https://community.nodemailer.com/2-0-0-beta/using-oauth2/
- #fetch https://community.nodemailer.com/2-0-0-beta/setup-smtp/
- #fetch https://community.nodemailer.com/2-0-0-beta/setup-transporter/
- #fetch https://community.nodemailer.com/address-formatting/
- #fetch https://community.nodemailer.com/using-attachments/
- #fetch https://community.nodemailer.com/using-embedded-images/
- #fetch https://community.nodemailer.com/using-alternative-content/
- #fetch https://community.nodemailer.com/2-0-0-beta/custom-headers/
- #fetch https://community.nodemailer.com/2-0-0-beta/list-headers/
- #fetch https://community.nodemailer.com/2-0-0-beta/templating/
- #fetch https://community.nodemailer.com/delivering-bulk-mail/
- #fetch https://community.nodemailer.com/using-gmail/
- #fetch https://community.nodemailer.com/about/

#### Mock Email Server

- #fetch https://github.com/rnwood/smtp4dev
- #fetch https://github.com/rnwood/smtp4dev/blob/master/docs/README.md
- #fetch https://mokapi.io/docs/welcome
- #fetch https://www.rfc-editor.org/rfc/rfc3501.html
- #fetch https://datatracker.ietf.org/doc/html/rfc2595

#### Email Standards

- #fetch https://www.fastmail.help/hc/en-us/articles/1500000278382-Email-standards

##### Email Structure

- #fetch https://datatracker.ietf.org/doc/html/rfc5322
  - #fetch https://datatracker.ietf.org/doc/html/rfc822
  - #fetch https://datatracker.ietf.org/doc/html/rfc2822
- #fetch https://datatracker.ietf.org/doc/html/rfc2045
- #fetch https://datatracker.ietf.org/doc/html/rfc2046
- #fetch https://datatracker.ietf.org/doc/html/rfc2047
- #fetch https://datatracker.ietf.org/doc/html/rfc2231

##### Email Protocols

- #fetch https://datatracker.ietf.org/doc/html/rfc5321
- #fetch https://datatracker.ietf.org/doc/html/rfc3501
- #fetch https://datatracker.ietf.org/doc/html/rfc4551
- #fetch https://datatracker.ietf.org/doc/html/rfc1939
- #fetch https://datatracker.ietf.org/doc/html/rfc8620

##### Email Security

- #fetch https://datatracker.ietf.org/doc/html/rfc2595
- #fetch https://datatracker.ietf.org/doc/html/rfc3207
- #fetch https://datatracker.ietf.org/doc/html/rfc5246
- #fetch https://datatracker.ietf.org/doc/html/rfc6376
- #fetch https://datatracker.ietf.org/doc/html/rfc8617

##### Service Discover

- #fetch https://www.bucksch.org/1/projects/thunderbird/autoconfiguration/
- #fetch https://datatracker.ietf.org/doc/html/rfc6186

##### Filtering 

- #fetch https://datatracker.ietf.org/doc/html/rfc5228
- #fetch https://www.fastmail.help/hc/en-us/articles/1500000278122-Filters-Rules
