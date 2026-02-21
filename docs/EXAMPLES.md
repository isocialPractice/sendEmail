# sendEmail Usage Examples

Real-world examples for the `sendEmail` command-line tool.

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

### Example 18: Copy Tool to a Project

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
