# sendEmail CLI Cheatsheet

Quick reference for the `sendEmail` command-line tool.

`Ctrl + click` to view [docs](https://isocialpractice.github.io/sendEmail/index.html?cli-cheatsheet)

---

## Common Patterns

```bash
# Quick text email (raw mode)
sendEmail -t someone@example.com "Your message here"

# Send HTML file (no config-email — direct path)
sendEmail --send-to john@example.com --subject "Hello" --message-html ./email.html

# Send with Markdown (auto-converted to HTML)
sendEmail --send-to jane@example.com --subject "Update" --message-file ./update.md

# Use a configured email template (html auto-resolved from email.json "html" string)
sendEmail --config-email billing --send-to client@example.com

# Use configured email where "html" is an array — select default html.htm[l]
sendEmail --config-email example --message-html

# Use configured email where "html" is an array — select by index
sendEmail --config-email example --message-html 1

# Use configured email where "html" is an array — select by filename
sendEmail --config-email example --message-html html_b

# Use a specific account
sendEmail --account myaccount --send-to someone@example.com --subject "Test"

# Bulk send to list (no prompt)
sendEmail --config-email newsletter --email-list subscribers --force

# Send one email to all contacts on a list
sendEmail --config-email billing --email-list clients --send-all --force

# Send with logging enabled
sendEmail --config-email billing --email-list clients --log --force
# Writes: logs/1.log, logs/2.log, ... (sequential)

# Send with attachment
sendEmail --send-to john@example.com --subject "Report" \
  --message-html ./body.html \
  --attach-file "Report.pdf" --attach-path ./report.pdf

# Send with inline image
sendEmail --send-to jane@example.com \
  --message-html ./body.html \
  --attach-file "logo.png" \
  --attach-path ./img/logo.png \
  --attach-cid "logo@company.com" \
  --attach-content-disp "inline"

# Create email list from tool files
sendEmail --new-list clients
# Reads: __sendEmail__clients-emails.txt, __sendEmail__clients-names.txt
# Creates: lists/clients.json

# Copy tool to project (setup runs automatically, creates config/accounts/_default.js)
sendEmail --copy ./my-project
# Then: running sendEmail from ./my-project/ uses ./my-project/sendEmail/config/

# Copy only config/support types (for local config override, no tool files)
sendEmail --copy:config ./my-project
# Copies: config/emails/, config/globals/, attachments/, img/

# Copy only config/support types without account setup (uses root account)
sendEmail --copy:config-no-account ./my-project
# Copies: config/emails/, config/globals/, attachments/, img/ (no config/accounts/ created)

# Explicit full tool copy
sendEmail --copy:tool ./my-project

# Show full help
sendEmail -h

# Run all tests
sendEmail --test
```

---

## Terminal Format Mode

Use `--command-format` (must be **first** option) to embed live command output in argument values:

```bash
# Git commit hash as subject
sendEmail --command-format \
  --send-to dev@example.com \
  --subject "$> {{ git log --oneline -1 }};"

# Full commit message as email body (multiple commands, concatenated)
sendEmail --command-format \
  --send-to qa@example.com \
  --subject "$> {{ git log --oneline -1 }};" \
  --message-text "$>command: {{ git log -1 --pretty=%B }}; $>command: {{ echo }}; $>command: {{ git show --name-only HEAD | tail -n +8 }};"

# Mix of raw data and terminal format — raw values pass through unchanged
sendEmail --command-format \
  --send-to john@example.com \
  --subject "$> {{ git log --oneline -1 }};" \
  --message-file ./notify.html \
  --force
```

> See [TERMINAL-FORMAT.md](TERMINAL-FORMAT.md) for syntax rules, prohibited commands, and full examples.

---

## Options Quick Reference

| Option | Short | Type | Description |
|--------|-------|------|-------------|
| `--account <name>` | | mixed | Account from `config/accounts/` |
| `--config-email <name>` | | normal/rep | Template from `config/emails/` |
| `--copy [path]` | `-c` | null:rep `<tools>` | Copy full tool to path (runs setup) |
| `--copy:config [path]` | `-c:config` | null:rep `<config>` | Copy config/support types only (with account setup) |
| `--copy:config-no-account [path]` | `-c:config-no-account` | null:rep `<config:no-account>` | Copy config/support types only (no account setup, uses root account) |
| `--copy:tool [path]` | `-c:tool` | null:rep `<tools>` | Explicit full tool copy |
| `--help [section]` | `-h` | null:prod | Show help |
| `--force` | `-f` | null | Skip confirmation |
| `--test [name]` | | null:rep | Run tests |
| `--text <addr> [msg]` | `-t` | raw | Quick text email |
| `--command-format` | | terminal | Activate terminal mode (must be first option) |
| `--send-to <addr...>` | | mixed | Recipient(s) |
| `--subject <text>` | | mixed | Email subject |
| `--message-file <path>` | | mixed | Message file (.html/.txt/.md) |
| `--message-html [path]` | | mixed | HTML file; optional arg selects from `"html"` array when using `--config-email` |
| `--message-text <path>` | | mixed | Text message file |
| `--from-address <email>` | | mixed | Override from address |
| `--reply-to <email...>` | | mixed | Reply-to address(es) |
| `--cc <addr...>` | | mixed | CC address(es) |
| `--bcc <addr...>` | | mixed | BCC address(es) |
| `--attach-file <name...>` | | mixed | Attachment filename(s) |
| `--attach-path <path...>` | | mixed | Attachment path(s) |
| `--attach-cid <cid...>` | | mixed | Inline image CID(s) |
| `--attach-content-disp <v...>` | | mixed | `inline` or `attachment` |
| `--email-list <name>` | | repetitive | Bulk list from `lists/` |
| `--send-all` | | configurable | Send one email to all list contacts |
| `--log` | | boolean | Log sent email to `logs/<n>.log` |
| `--new-list <name>` | | aggressive | Create list from tool files |
| `--list-tool-path <path>` | | passive | Path to tool files |

---

## Send Modes

| Mode | Trigger | Description |
|------|---------|-------------|
| **Raw** | `-t, --text` | Quick email with minimal options |
| **Normal** | `--send-to`, `--config-email` | Structured email with full options |
| **Repetitive** | `--email-list` | Bulk send to a contact list |

---

## Help Sections

```bash
sendEmail -h                           # Full help
sendEmail -h options                   # All options
sendEmail -h options:configurable      # Configurable options only
sendEmail -h options:non-configurable  # Non-configurable options only
sendEmail -h options:tool              # Tool options only
sendEmail -h arguments                 # All arguments
sendEmail -h arguments:configurable    # Configurable arguments only
sendEmail -h arguments:non-configurable # Non-configurable arguments only
```

---

## Template Variables

| Variable | Example Value |
|----------|---------------|
| `{{contact.name}}` | John Doe |
| `{{contact.email}}` | john@example.com |
| `{{contact.<field>}}` | Any custom list field |
| `{{date}}` | 2026-02-19 |
| `{{date.formatted}}` | February 19, 2026 |
| `{{date.short}}` | 2/19/2026 |
| `{{list.index}}` | 0 (current index) |
| `{{list.count}}` | 100 (total recipients) |

---

## Config Structure

```
config/
├── accounts/
│   ├── _default.js        # Required default account
│   └── myaccount.js       # Additional accounts
├── emails/
│   └── billing/           # One folder per email template
│       ├── email.json     # Email metadata (to, subject, html, attachments, globals, etc.)
│       ├── email.js       # Attachment configuration (exports emailAttachments)
│       └── html/
│           └── template.htm
└── globals/
    └── footer/
        └── global.js      # Reusable global attachments (exports globalAttachments)
```

### email.json — `attachments` property

References the `emailAttachments` export from the paired `email.js`:

```json
"attachments": "{email.emailAttachments}"
```

`email` = `email.js` in the same folder · `emailAttachments` = the named export.

### email.js — attachment array

```js
import { globalAttachments as footerAttachments } from '../../globals/footer/global.js';

export const emailAttachments = [
  { filename: 'Report.pdf', path: 'attachments/Report.pdf' },
  { filename: 'logo.jpg', path: 'img/logo.jpg', contentDisposition: 'inline', cid: 'logo@example.local' },
  ...footerAttachments,  // merge in global attachments
];
```

> Every `config/emails/<folderName>/` must contain both `email.js` and `email.json`.

### email.json — `sendAll` configuration

Send one email to all contacts on a list:

```json
{
  "sendAll": true,
  "emailList": "billing"
}
```

Or with inline contacts:

```json
{
  "sendAll": true,
  "email-list": [
    { "email": "john@site.com", "name": "John" },
    { "email": "jane@site.com", "name": "Jane" }
  ]
}
```

Without `sendAll`, `emailList` / `email-list` triggers one-email-per-contact (repetitive) mode.
