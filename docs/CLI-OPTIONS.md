# sendEmail CLI Options Reference

Complete documentation for all `sendEmail` command-line options.

---

## Terminology

| Term | Description |
|------|-------------|
| **Non-configurable Option** | Passed to CLI only; not stored in config files |
| **Configurable Option** | Can be passed to CLI or set in `config/emails/*/email.json` |
| **Tool Option** | Disables email sending; used for scripting/maintenance |
| **Aggressive** | Tool option that activates tool mode |
| **Passive** | Tool option that requires an aggressive option |

---

## Non-configurable Options

These options are passed on the command line only and do not appear in config files.

### `--account <name>`

**Type:** `mixed`

Specify a configured email account from `config/accounts/`. The `<name>` is the filename without extension.

```bash
sendEmail --account jane --send-to someone@example.com --subject "Hello"
```

- If omitted, uses `config/accounts/_default.js`
- The default account **must** exist at `config/accounts/_default.js`

---

### `--config-email <name>`

**Type:** `normal` | `repetitive`

Use a pre-configured email template from `config/emails/<name>/`. The `<name>` is the folder name.

```bash
sendEmail --config-email billing --send-to client@example.com
sendEmail --config-email newsletter --email-list subscribers --force
```

- Loads `email.json` for metadata (to, subject, html, etc.)
- Loads `email.js` for attachment configuration
- CLI options override values from `email.json`

---

### `-c, --copy [path]`

**Type:** `null:reproductive`

Copy the sendEmail tool to a specified path (or the current directory if `[path]` is omitted).

```bash
sendEmail --copy ./my-project
sendEmail -c /var/tools/sendEmail
sendEmail -c                          # copies to CWD
```

> **Important:** `config/accounts/` is **never** copied — it contains sensitive credentials.
> After copying, create your own `config/accounts/_default.js`.

---

### `-h, --help [section]`

**Type:** `null:productive`

Display help documentation. Without an argument, shows full help.

```bash
sendEmail -h
sendEmail -h options
sendEmail -h options:configurable
sendEmail -h options:non-configurable
sendEmail -h options:tool
sendEmail -h arguments
sendEmail -h arguments:configurable
sendEmail -h arguments:non-configurable
```

---

### `-f, --force`

**Type:** `null`

Skip the confirmation prompt before sending. Useful for scripting and automation.

```bash
sendEmail --config-email newsletter --email-list subscribers --force
```

---

### `--test [unitTest]`

**Type:** `null:reproductive`

Run the test suite. Without an argument, runs all tests. With an argument, runs a specific unit test by name.

```bash
sendEmail --test                    # run all tests
sendEmail --test engine             # run tests matching "engine"
sendEmail --test template-engine    # run tests matching "template-engine"
```

---

### `-t, --text <address> [message]`

**Type:** `raw`

Send a quick text email directly without configuration files.

```bash
sendEmail -t someone@example.com "Quick message here"
sendEmail --text john@example.com "Meeting at 3pm"
```

- Uses the default account from `config/accounts/_default.js`
- Message is sent as plain text

---

## Configurable Options

These options can be passed on the CLI or set as properties in `config/emails/*/email.json`.
CLI values always override config file values.

### `--send-to <address...>`

**Type:** `mixed`

Specify one or more recipient email addresses.

```bash
sendEmail --send-to john@example.com
sendEmail --send-to alice@example.com bob@example.com carol@example.com
```

- Accepts multiple addresses (space-separated)
- Overrides `"to"` in `email.json`

---

### `--subject <text>`

**Type:** `mixed`

Set the email subject line. Supports template variables.

```bash
sendEmail --subject "Monthly Newsletter"
sendEmail --subject "Invoice for {{contact.name}}"
```

---

### `--message-file <path>`

**Type:** `mixed`

Set the email message body from a file. The file extension determines the content type:

| Extension | Type |
|-----------|------|
| `.html`, `.htm` | HTML |
| `.txt` | Plain text |
| `.md` | Markdown (converted to HTML) |

```bash
sendEmail --message-file ./message.html
sendEmail --message-file ./newsletter.md
sendEmail --message-file ./announcement.txt
```

---

### `--message-html <path>`

**Type:** `mixed`

Explicitly set an HTML message file (regardless of extension).

```bash
sendEmail --message-html ./template.htm
```

---

### `--message-text <path>`

**Type:** `mixed`

Explicitly set a plain text message file (regardless of extension).

```bash
sendEmail --message-text ./message.txt
```

---

### `--from-address <email>`

**Type:** `mixed`

Override the from address. If not specified, uses the account's configured user address.

```bash
sendEmail --from-address noreply@company.com --send-to client@example.com
```

---

### `--reply-to <email...>`

**Type:** `mixed`

Set the reply-to address(es).

```bash
sendEmail --reply-to support@company.com
sendEmail --reply-to alice@company.com bob@company.com
```

---

### `--cc <address...>`

**Type:** `mixed`

Carbon copy recipient(s).

```bash
sendEmail --cc manager@company.com --send-to client@example.com
```

---

### `--bcc <address...>`

**Type:** `mixed`

Blind carbon copy recipient(s).

```bash
sendEmail --bcc archive@company.com
```

---

### `--attach-file <filename...>`

**Type:** `mixed`

Attachment filename(s). Paired positionally with `--attach-path`.

```bash
sendEmail --attach-file "report.pdf" --attach-path "./attachments/report.pdf"
```

---

### `--attach-path <path...>`

**Type:** `mixed`

Attachment file path(s). Paired positionally with `--attach-file`.

```bash
sendEmail \
  --attach-file "Invoice.pdf" \
  --attach-path "./attachments/Invoice.pdf" \
  --attach-file "logo.png" \
  --attach-path "./img/logo.png" \
  --attach-cid "logo@company.com" \
  --attach-content-disp "inline"
```

---

### `--attach-cid <cid...>`

**Type:** `mixed`

Content ID(s) for inline images. Corresponds positionally with `--attach-path`.
Used in HTML with `<img src="cid:logo@company.com">`.

```bash
sendEmail --attach-cid "logo@company.com" --attach-path "./img/logo.png" --attach-content-disp "inline"
```

---

### `--attach-content-disp <value...>`

**Type:** `mixed`

Content disposition(s) for attachments. Values: `attachment` (default) or `inline`.

```bash
sendEmail --attach-content-disp "inline" --attach-path "./img/logo.png" --attach-cid "logo@company.com"
```

---

### `--email-list <listName>`

**Type:** `repetitive`

Use an email list for bulk sending. The `<listName>` refers to a file in `lists/<listName>.json`.
Triggers **repetitive mode** — requires `--config-email`.

```bash
sendEmail --config-email newsletter --email-list subscribers
sendEmail --config-email billing --email-list clients --force
```

---

## Tool Options

Tool options disable email sending. They are used for list management and maintenance.

### `--new-list <listName>`

**Type:** `aggressive`

Create a new email list from tool files. Looks for:
- `__sendEmail__<listName>-emails.txt` — one email per line
- `__sendEmail__<listName>-names.txt` — one name per line

```bash
# With tool files in CWD:
sendEmail --new-list clients

# With tool files in a specific path:
sendEmail --new-list clients --list-tool-path ./data/
```

Output: `lists/<listName>.json`

---

### `--list-tool-path <path>`

**Type:** `passive`

Specify the directory containing tool files for `--new-list`.
Default: current working directory.

```bash
sendEmail --new-list clients --list-tool-path /data/email-lists/
```

---

## Template Variables

Use these variables in subject lines, HTML templates, and other configurable text:

| Variable | Value |
|----------|-------|
| `{{contact.name}}` | Contact's name from email list |
| `{{contact.email}}` | Contact's email from email list |
| `{{contact.<field>}}` | Any custom field from email list |
| `{{date}}` | Current date: `2026-02-19` |
| `{{date.formatted}}` | Formatted date: `February 19, 2026` |
| `{{date.short}}` | Short date: `2/19/2026` |
| `{{subject}}` | Email subject |
| `{{list.index}}` | Current index (0-based) in bulk send |
| `{{list.count}}` | Total recipients in bulk send |

**Legacy placeholders** (from old batch scripts) are also supported:
- `CH-EMAILONLIST` → contact name
- `CHANGE_SEND_TO` → contact email
- `CHANGE_MESSAGE_HEADER` → email subject
