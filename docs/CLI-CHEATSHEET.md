# sendEmail CLI Cheatsheet

Quick reference for the `sendEmail` command-line tool.

---

## Common Patterns

```bash
# Quick text email (raw mode)
sendEmail -t someone@example.com "Your message here"

# Send HTML file
sendEmail --send-to john@example.com --subject "Hello" --message-html ./email.html

# Send with Markdown (auto-converted to HTML)
sendEmail --send-to jane@example.com --subject "Update" --message-file ./update.md

# Use a configured email template
sendEmail --config-email billing --send-to client@example.com

# Use a specific account
sendEmail --account myaccount --send-to someone@example.com --subject "Test"

# Bulk send to list (no prompt)
sendEmail --config-email newsletter --email-list subscribers --force

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

# Copy tool to project (excludes credentials)
sendEmail --copy ./my-project

# Show full help
sendEmail -h

# Run all tests
sendEmail --test
```

---

## Options Quick Reference

| Option | Short | Type | Description |
|--------|-------|------|-------------|
| `--account <name>` | | mixed | Account from `config/accounts/` |
| `--config-email <name>` | | normal/rep | Template from `config/emails/` |
| `--copy [path]` | `-c` | null:rep | Copy tool to path |
| `--help [section]` | `-h` | null:prod | Show help |
| `--force` | `-f` | null | Skip confirmation |
| `--test [name]` | | null:rep | Run tests |
| `--text <addr> [msg]` | `-t` | raw | Quick text email |
| `--send-to <addr...>` | | mixed | Recipient(s) |
| `--subject <text>` | | mixed | Email subject |
| `--message-file <path>` | | mixed | Message file (.html/.txt/.md) |
| `--message-html <path>` | | mixed | HTML message file |
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
│   └── billing/
│       ├── email.json     # Email metadata (to, subject, html, etc.)
│       ├── email.js       # Attachment configuration
│       └── html/
│           └── template.htm
└── globals/
    └── footer/
        └── global.js      # Reusable global attachments
```
