# sendEmail Usage Examples

<!-- {% raw %} -->

Real-world examples for the `sendEmail` command-line tool.

`Ctrl + click` to view [docs](https://isocialpractice.github.io/sendEmail/index.htm?examples)

---

## Beginner Examples

### Example 1: Quick Text Email

The simplest way to send an email:

```bash
sendEmail -t someone@example.com "Hello, this is a quick message."
```

### Example 2: Send an HTML File

```bash
sendEmail \
  --send-to john@example.com \
  --subject "Company Newsletter" \
  --message-html ./newsletter.html
```

### Example 3: Send a Markdown File

Markdown is automatically converted to email-safe HTML:

```bash
sendEmail \
  --send-to team@company.com \
  --subject "Sprint Update" \
  --message-file ./sprint-update.md
```

### Example 4: Send with CC and BCC

```bash
sendEmail \
  --send-to client@example.com \
  --cc assistant@company.com \
  --bcc archive@company.com \
  --subject "Project Proposal" \
  --message-html ./proposal.html
```

---

## Intermediate Examples

### Example 5: Send with Attachments

```bash
sendEmail \
  --send-to client@example.com \
  --subject "Monthly Report - February 2026" \
  --message-html ./report-email.html \
  --attach-file "February-Report.pdf" \
  --attach-path "./attachments/February-Report.pdf"
```

### Example 6: Send with Inline Images

Use Content-ID (CID) references for images embedded in HTML:

```html
<!-- In your HTML file: -->
<img src="cid:logo@company.com" alt="Company Logo">
```

```bash
sendEmail \
  --send-to client@example.com \
  --subject "Branded Email" \
  --message-html ./branded-email.html \
  --attach-file "logo.png" \
  --attach-path "./img/logo.png" \
  --attach-cid "logo@company.com" \
  --attach-content-disp "inline"
```

### Example 7: Multiple Inline Images

```bash
sendEmail \
  --send-to client@example.com \
  --subject "Visual Report" \
  --message-html ./visual-report.html \
  --attach-file "logo.png" --attach-path "./img/logo.png" \
    --attach-cid "logo@company.com" --attach-content-disp "inline" \
  --attach-file "chart.png" --attach-path "./img/chart.png" \
    --attach-cid "chart@company.com" --attach-content-disp "inline" \
  --attach-file "map.jpg" --attach-path "./img/map.jpg" \
    --attach-cid "map@company.com" --attach-content-disp "inline"
```

### Example 8: Use a Configured Email Template

```bash
sendEmail --config-email billing --send-to client@example.com
```

Override specific fields from the template:

```bash
sendEmail \
  --config-email billing \
  --send-to client@example.com \
  --subject "Custom Subject Override" \
  --account premium-account
```

### Example 8a: Select HTML from a Config Array

When `email.json` has `"html"` as an array (e.g. `["html_a", "html_b"]`), use `--message-html` to choose which file to send.

**`config/emails/example/email.json`:**
```json
{
  "to": "CHANGE_SEND_TO",
  "subject": "Your Request",
  "html": ["html_a", "html_b"]
}
```

```bash
# Use the default html.htm[l] in the email's html/ folder (flag only — no argument)
sendEmail --config-email example --send-to client@example.com --message-html

# Select by 0-based index (resolves html_a)
sendEmail --config-email example --send-to client@example.com --message-html 0

# Select by filename (resolves html_b)
sendEmail --config-email example --send-to client@example.com --message-html html_b

# Override entirely with a CWD-relative path (any "html" type)
sendEmail --config-email example --send-to client@example.com --message-html ./custom/override.htm
```

> **Default file:** If `--message-html` is omitted (or passed as a flag) and `"html"` is an array,
> the engine looks for `html.htm` or `html.html` in the email's `html/` folder. This file does not
> need to appear in the array.

### Example 9: Use a Specific Account

```bash
sendEmail \
  --account marketing \
  --send-to newsletter@example.com \
  --subject "Marketing Update" \
  --message-html ./marketing.html
```

### Example 10: Reply-To Different Address

```bash
sendEmail \
  --send-to client@example.com \
  --from-address noreply@company.com \
  --reply-to support@company.com \
  --subject "Auto-notification" \
  --message-text ./notification.txt
```

---

## Advanced Examples

### Example 11: Bulk Send to Email List

First, create a list at `lists/clients.json`:

```json
{
  "email-list": [
    { "email": "alice@example.com", "name": "Alice" },
    { "email": "bob@example.com", "name": "Bob" },
    { "email": "carol@example.com", "name": "Carol" }
  ]
}
```

Then send:

```bash
sendEmail \
  --config-email billing \
  --email-list clients \
  --force
```

### Example 12: Template Variables in Bulk Send

In your HTML template (`config/emails/billing/html/invoice.htm`):

```html
<p>Dear {{contact.name}},</p>
<p>Your invoice is attached.</p>
<p>Email: {{contact.email}}</p>
<p>Date: {{date.formatted}}</p>
<p>This is email {{list.index}} of {{list.count}}.</p>
```

Or using legacy placeholders:

```html
<p>Dear CH-EMAILONLIST,</p>
```

### Example 13: Send-All — One Email to All List Contacts

Send one email addressed to everyone on a list:

```bash
sendEmail \
  --config-email billing \
  --email-list clients \
  --send-all \
  --force
```

This sends **1 email** with all contacts in the `To:` field.
The `CH-EMAILONLIST` placeholder is stripped since per-contact personalization
does not apply.

### Example 14: Send-All via email.json Configuration

Set `sendAll` and `emailList` directly in `email.json`:

```json
{
  "to": "CHANGE_SEND_TO",
  "from": "_default",
  "subject": "Company Announcement",
  "html": "html_a",
  "sendAll": true,
  "emailList": "billing"
}
```

Then run:

```bash
sendEmail --config-email billing --force
```

### Example 15: Send-All with Inline Contact List

Embed the contact list directly in `email.json`:

```json
{
  "to": "CHANGE_SEND_TO",
  "from": "_default",
  "subject": "Team Meeting Notes",
  "html": "html_a",
  "sendAll": true,
  "email-list": [
    { "email": "john_a@site.com", "name": "John Apple" },
    { "email": "jane_a@site.com", "name": "Jane Apple" }
  ]
}
```

```bash
sendEmail --config-email meeting-notes --force
```

### Example 16: Create an Email List from Tool Files

Create two tool files in your working directory:

**`__sendEmail__newsletter-emails.txt`:**
```
alice@example.com
bob@example.com
carol@example.com
```

**`__sendEmail__newsletter-names.txt`:**
```
Alice Smith
Bob Jones
Carol White
```

Then generate the list:

```bash
sendEmail --new-list newsletter
# Creates: lists/newsletter.json
```

Then send:

```bash
sendEmail --config-email newsletter --email-list newsletter --force
```

### Example 17: Billing Statement Workflow

```bash
# 1. Create client list
sendEmail --new-list clients --list-tool-path ./data/

# 2. Review the list
cat lists/clients.json

# 3. Send billing statements (with confirmation prompt)
sendEmail --config-email billing --email-list clients

# 4. Send without prompt (automation)
sendEmail --config-email billing --email-list clients --force
```

### Example 18a: Inline Global Templates

Use `{% global 'name' %}` inside any HTML email template to embed a reusable block (footer, signature, etc.). The global's attachments (inline images, logos) are automatically included.

**`config/globals/footer/global.js`**:
```javascript
export const globalAttachments = [
  { filename: 'logo.png', path: 'img/logo.png', contentDisposition: 'inline', cid: 'logo@myco.com' },
];
```

**`config/globals/footer/html.htm`**:
```html
<div>
  <p>Best regards, The Team</p>
  <img src="cid:logo@myco.com" alt="Logo" />
</div>
```

**`config/emails/newsletter/html/body.htm`**:
```html
<p>Hello {{contact.name}},</p>
<p>Here is your monthly update.</p>

{% global 'footer' %}
```

When sent, `{% global 'footer' %}` is replaced by the footer HTML and the logo attachment is merged automatically.

### Example 18b: Nested Global Folders

For different footers per email category, use nested globals:

```
config/globals/
  footer/
    billing/
      global.js
      html.htm           ← billing-specific footer
    marketing/
      global.js
      html/
        footer.htm       ← marketing footer (subfolder, relaxed naming)
    global.js            ← shared base footer
    html.htm
```

Reference nested globals by path:

```html
{% global 'footer/billing' %}
{% global 'footer/marketing' %}
```

### Example 18c: Copy sendEmail to a Project

```bash
# Copy sendEmail to a new project directory
sendEmail --copy ~/projects/my-project/sendEmail

# Then navigate to the copied instance and configure
cd ~/projects/my-project/sendEmail
cp config/accounts/example.js config/accounts/_default.js
# Edit _default.js with your credentials
npm install
npm run build
```

### Example 18d: Copy Config Without Account Setup

Use `--copy:config-no-account` when the destination project will always use the
sendEmail root account credentials (no local `_default.js` needed):

```bash
# Copy config/support types only — no config/accounts/ created
sendEmail --copy:config-no-account ~/projects/my-project/sendEmail

# Use the config copy from a parent directory — account falls back to root _default.js
cd ~/projects/my-project
sendEmail --config-email billing --send-to client@example.com
```

**Account resolution with `--copy:config-no-account`:**

| Scenario | Account used |
|----------|-------------|
| Local copy has no `config/accounts/` | sendEmail root `_default.js` (fallback) |
| Local copy has `config/accounts/` with valid `_default.js` | Local copy's `_default.js` |
| Local copy has `config/accounts/` but file has an error | Custom error with context — check credentials or remove the folder |

Compare with `--copy:config` (the default, with account setup), which runs the OS setup script
to create a template `config/accounts/_default.js` at the destination.

---

## Automation Examples

### Example 19: Scripted Daily Email (Bash)

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
sendEmail \
  --send-to team@company.com \
  --subject "Daily Standup - $DATE" \
  --message-file ./standup-template.md \
  --force
```

### Example 20: Notification After a Task

```bash
# After a long-running job:
./run-backup.sh && sendEmail \
  -t admin@company.com "Backup completed successfully on $(date)"
```

### Example 21: Batch Processing with a List

```bash
# Generate list from data export
cat data/emails.csv | awk -F, '{print $1}' > __sendEmail__report-emails.txt
cat data/emails.csv | awk -F, '{print $2}' > __sendEmail__report-names.txt

# Create the list
sendEmail --new-list report

# Send reports
sendEmail --config-email monthly-report --email-list report --force
```

---

## Terminal Format Mode Examples

Use `--command-format` as the **first option** to embed live command output in argument values.

> See [TERMINAL-FORMAT.md](TERMINAL-FORMAT.md) for full syntax reference and prohibited commands.

### Example T1: Git Commit as Email Subject

Send a notification email with the latest commit hash and title as the subject:

```bash
sendEmail --command-format \
  --send-to team@example.com \
  --subject "$> {{ git log --oneline -1 }};" \
  --message-file ./deploy-notify.html \
  --force
```

Subject becomes: `a1b2c3d (HEAD -> main) fix: update login validation`

### Example T2: Full Commit Message as Email Body

Send the full commit message (title + body) as the email body:

```bash
sendEmail --command-format \
  --send-to dev@example.com \
  --subject "Deploy: $> {{ git log --oneline -1 }};" \
  --message-text "$>command: {{ git log -1 --pretty=%B }};"
```

### Example T3: Commit Message + Changed Files

Chain multiple commands to include the commit message and a list of changed files:

```bash
sendEmail --command-format \
  --send-to qa@example.com \
  --subject "$> {{ git log --oneline -1 }};" \
  --message-text "$>command: {{ git log -1 --pretty=%B }}; $>command: {{ echo }}; $>command: {{ git show --name-only HEAD | tail -n +8 }};"
```

The `--message-text` argument resolves to (commands concatenated with newlines):

```
fix: update Copilot tool references for infra change

- Add Workflows as a new CopilotCategory to match the awesome-copilot
  repo's workflows/ folder...

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>

package.json
src/folderMappingPanel.ts
src/treeProvider.ts
src/types.ts
```

### Example T4: Mix of Raw Data and Terminal Format

Raw values (no `$>` syntax) pass through unchanged; only the subject uses terminal format:

```bash
sendEmail --command-format \
  --send-to john@example.com \
  --cc archive@example.com \
  --subject "$> {{ git log --oneline -1 }};" \
  --message-file ./template.html \
  --force
```

`--cc` and `--message-file` are raw and unchanged. Only `--subject` is expanded.

### Example T5: Template Variables Combined with Terminal Format

Terminal Mode expands `$>command: {{ ... }};` blocks first, then the template engine
substitutes `{{variables}}`. Both can coexist in the same invocation:

```bash
sendEmail --command-format \
  --config-email newsletter \
  --email-list subscribers \
  --subject "$> {{ git log --oneline -1 }}; — {{dates.month}} {{dates.year}}" \
  --force
```

Subject after full resolution: `a1b2c3d fix: update login — February 2026`

---

## Error Recovery Examples

### Example 22: Test Before Sending

Verify SMTP connectivity and configuration first:

```bash
sendEmail --test
```

### Example 23: Preview Before Bulk Send

Send to yourself first to preview:

```bash
sendEmail \
  --config-email newsletter \
  --send-to myaddress@example.com \
  --subject "[PREVIEW] Newsletter"
```

Then send for real:

```bash
sendEmail --config-email newsletter --email-list subscribers --force
```

---

## Account Configuration Examples

### Gmail Account (`config/accounts/gmail.js`)

```javascript
import nodemailer from 'nodemailer';

// Option A: New-style (recommended)
export const account = {
  service: 'gmail',
  auth: {
    user: 'your@gmail.com',
    pass: 'your-app-password', // Use App Password, not account password
  },
};

// Option B: Legacy nodemailer transporter (still supported)
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your@gmail.com',
    pass: 'your-app-password',
  },
});
```

> **Gmail:** Use an App Password (2FA must be enabled). Go to Google Account > Security > App Passwords.

### Custom SMTP Account (`config/accounts/smtp.js`)

```javascript
export const account = {
  host: 'smtp.yourprovider.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: 'your@email.com',
    pass: 'your-password',
  },
};
```

<!-- {% endraw %} -->
