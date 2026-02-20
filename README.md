# sendEmail

Command-line tool to send an email, or automate repetitive emails.

Built with TypeScript and [nodemailer](https://nodemailer.com/). Engine-like design — can be embedded in VS Code extensions, GUIs, or any Node.js application.

---

## Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Send a quick text email
sendEmail -t someone@example.com "Hello from sendEmail"

# Show full help
sendEmail -h
```

---

## Setup

### 1. Configure Your Email Account

Copy the example account and fill in your credentials:

```bash
cp config/accounts/example.js config/accounts/_default.js
# Edit _default.js with your email credentials
```

For **Gmail**, use an [App Password](https://support.google.com/accounts/answer/185833) (requires 2FA).

### 2. Build

```bash
npm run build
```

### 3. (Optional) Add to PATH

```bash
# Unix/macOS
chmod +x bin/sendEmail.sh
ln -s $(pwd)/bin/sendEmail.sh /usr/local/bin/sendEmail

# Windows: add the bin/ directory to your PATH
```

---

## Usage

```text
sendEmail [options] [arguments]
```

### Send Modes

| Mode | Example |
| ---- | ------- |
| **Raw** (quick text) | `sendEmail -t user@example.com "Message"` |
| **Normal** (structured) | `sendEmail --send-to user@example.com --subject "Hello" --message-html body.html` |
| **Repetitive** (bulk) | `sendEmail --config-email newsletter --email-list subscribers --force` |

### Common Examples

```bash
# Quick text email
sendEmail -t someone@example.com "Quick message"

# HTML email
sendEmail --send-to john@example.com --subject "Report" --message-html ./report.html

# Markdown email (auto-converted to HTML)
sendEmail --send-to team@company.com --subject "Update" --message-file ./update.md

# Configured email template
sendEmail --config-email billing --send-to client@example.com

# Bulk send to list
sendEmail --config-email newsletter --email-list subscribers --force

# Show help
sendEmail -h
sendEmail -h options
sendEmail -h options:configurable
```

---

## Project Structure

```text
sendEmail/
├── src/
│   ├── core/                  # Core engine (interface-agnostic)
│   │   ├── engine.ts          # EmailEngine class
│   │   ├── types.ts           # All TypeScript interfaces
│   │   ├── config-loader.ts   # Load configurations
│   │   ├── template-engine.ts # Template variable substitution
│   │   ├── list-processor.ts  # Email list iteration
│   │   ├── attachment-loader.ts
│   │   └── validator.ts
│   ├── cli/                   # CLI entry point
│   │   ├── index.ts           # Main CLI runner
│   │   ├── parser.ts          # Argument parsing
│   │   ├── help.ts            # Help documentation
│   │   └── prompts.ts         # Confirmation prompts
│   ├── utils/                 # Utilities
│   │   ├── file-utils.ts
│   │   ├── logger.ts
│   │   ├── error-handler.ts
│   │   └── markdown-html.ts
│   └── tools/                 # Tool scripts
│       ├── list-generator.ts  # --new-list
│       ├── copy-tool.ts       # --copy
│       └── test-runner.ts     # --test
├── bin/
│   ├── sendEmail.js           # Node.js entry (npm bin)
│   ├── sendEmail.sh           # Unix/macOS wrapper
│   ├── sendEmail.cmd          # Windows CMD wrapper
│   └── sendEmail.ps1          # PowerShell wrapper
├── config/
│   ├── accounts/              # Email account credentials
│   │   ├── _default.js        # REQUIRED default account
│   │   └── example.js
│   ├── emails/                # Configured email templates
│   │   ├── billing/
│   │   └── example/
│   └── globals/               # Reusable global templates
│       ├── footer/
│       └── example/
├── lists/                     # Email lists (.json)
├── attachments/               # Email attachments
├── img/                       # Embedded images
├── tests/
│   ├── unit/                  # Unit tests (vitest)
│   ├── mock/server/           # Mock SMTP server
│   └── logs/                  # Test logs
└── docs/
    ├── CLI-OPTIONS.md         # Full options reference
    ├── CLI-CHEATSHEET.md      # Quick reference
    ├── API.md                 # Engine API documentation
    └── EXAMPLES.md            # Real-world examples
```

---

## Configuration

### Account Config (`config/accounts/*.js`)

```javascript
// New-style (recommended):
export const account = {
  service: 'gmail',
  auth: { user: 'your@gmail.com', pass: 'app-password' },
};

// Or with custom SMTP:
export const account = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: { user: 'user@example.com', pass: 'password' },
};
```

### Email Config (`config/emails/<name>/email.json`)

```json
{
  "from": "_default",
  "subject": "Billing Statement - {{contact.name}}",
  "html": "billingStatement",
  "globals": ["footer"]
}
```

### Email List (`lists/<name>.json`)

```json
{
  "email-list": [
    { "email": "alice@example.com", "name": "Alice" },
    { "email": "bob@example.com", "name": "Bob" }
  ]
}
```

---

## Template Variables

Use in subject lines, HTML templates, and configurable text:

| Variable | Value |
| -------- | ----- |
| `{{contact.name}}` | Contact's name |
| `{{contact.email}}` | Contact's email |
| `{{contact.<field>}}` | Any custom field |
| `{{date}}` | `2026-02-19` |
| `{{date.formatted}}` | `February 19, 2026` |
| `{{list.index}}` | Current index (bulk send) |
| `{{list.count}}` | Total recipients |

Legacy placeholders (`CH-EMAILONLIST`, `CHANGE_SEND_TO`) are also supported.

---

## Using as a Library

```typescript
import { EmailEngine, createEngineConfig } from './dist/core/engine.js';

const engine = new EmailEngine(createEngineConfig(process.cwd()));
await engine.initialize();

const result = await engine.sendEmail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello',
  html: '<p>Hello, World!</p>',
});
```

See [docs/API.md](docs/API.md) for full API documentation.

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run build:watch` | Watch mode compilation |
| `npm run dev` | Run CLI directly with tsx (no build needed) |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run all tests once |
| `sendEmail --test` | Run tests via CLI |

---

## Documentation

- [CLI-OPTIONS.md](docs/CLI-OPTIONS.md) — Complete options reference
- [CLI-CHEATSHEET.md](docs/CLI-CHEATSHEET.md) — Quick reference
- [API.md](docs/API.md) — Engine API for developers
- [EXAMPLES.md](docs/EXAMPLES.md) — Real-world usage examples
