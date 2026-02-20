---
agent: 'agent'
description: 'This prompt file will be used to make the add the best data possible to the prompt file make-send-email-tool.prompt.md using the quasi-coder skill and guidelines from this prompt file that will then fill in the prompt file make-send-email-tool.prompt.md with awesome prompting data.'
tools: ['codebase', 'read', 'search', 'search/codebase', 'search/fileSearch', 'fetch']
---

# Make Prompt to Fill the Prompt File `make-send-email-tool.prompt.md`

This prompt is meant to generate the best copy/paste output that will be used as raw data in another prompt that will have the goal of filling the prompt file #file:make-send-email-tool.prompt.md, but this prompt file will not add or change data to the prompt file #file:./make-send-email-tool.prompt.md.

## Prompt File `make-send-email-tool.prompt.md` Overview

The prompt file `make-send-email-tool.prompt.md` is currently awaiting data, but the goal of it is to COMPLETELY restructure the current codebase using the quasi-coder skill to make a command-line tool that will send emails normally and autonomously. The prompt file `make-send-email-tool.prompt.md` is the next step in the process of making the command-line tool `sendEmail`.

## Command-line Tool `sendEmail`

The goal of the command-line tool `sendEmail` is to send emails. In two words that is the goal. **Send Emails**. But the tool will have features like:

- Send emails normally with the use of options or flags
- Send emails autonomusly with the use of options or flags, configuration files, and tool or helper files
- Allow for global templates in regards to attachments and embedded images
- Allow for custom templates in regards to attachments and embedded images
- Allow for global templates in regards to the email message raw text data
- Allow for global templates in regards to the email message html data
- Allow for custom templates in regards to the email message raw text data
- Allow for custom templates in regards to the email message html data
- Use email lists that will either:
  - Follow convential email list file types, utilizing acceptable properties and values i.e. using a contact list from Gmail
  - Utilize a simple email list convention tailored for the `sendEmail` tool:
    - Each email list will be in the `lists` folder, and be a JSON file
    - Each email list will have the parent property `email-list`
    - The parent most property `email-list` will have an array of objects value
    - The array of objects will have two properties each:
      - **name** - The name of the contact who will receive an email, which could be a full name, business name, nickname, etc.
      - **email** - The email address to be used
  - Utilize a more complex email list convention tailored for the `sendEmail` tool:
    - Each email list will be in the `lists` folder, and be a JSON file
    - Each email list will have the parent property `email-list`
    - The parent most property `email-list` will have an array of objects value
    - The array of objects will have any number of `type` mapped custom properties, but these properties will be similar to conventional email contact properties i.e. Gmail or Outlook
    - The array of objests are **REQUIRED** to have two propeties:
      - **name** - The name of the contact who will receive an email, which could be a full name, business name, nickname, etc.
      - **email** - The email address to be used
- Email list will be used to customize the email's data in regards to:
  - Data in the email message
  - Attachment filename
  - Attachment path
  - Embedded graphics (*i.e. img.jpg with `cid: "img@example.com"`*)
  - Email subject
  - Name to address in email e.g. salutation of "Hello CHANGE_NAME" to "Hello John Doe", where "John Doe" is the value of a `name` property in an email list and the `sendEmail` command used flags to send to each contact of an email list one at a time, and NOT all at once
- Email lists can be created using helper files:
    1. Right now, we only want to use this when creating simple list, whose array of objects has two properties: `email` and `name`. 
    2. The number of lines MUST match
    3. The tool files MUST follow the naming pattern of:
      - __sendEmail__<listName>-names.txt
      - __sendEmail__<listName>-emails.txt
      - Use case example:
        - The file "__sendEmail__salesTeam-names.txt" has 2 names, and is in the same folder where the terminal is running
        - The file "__sendEmail__salesTeam-emails.txt" has 2 emails, and is in the same folder where the terminal is running
        - In the command line `sendEmail --new-list [salesTeam] [--list-tool-path] [path/to/list/tool]`, where in this use case the argument `salesTeam` passed to `--new-list`, the option `--list-tool-path` and the argument passed to it `path/to/list/tool` are optional since in this use case the tool file are in the same folder, and use the correct file naming pattern of `__sendEmail__<listName>-<[names]|[emails]>.txt` where `<listName>` will be the name of the file. Here it is `salesTeam`. The optional options and arguements would produce the same results if passed like `sendEmail --new-list salesTeam --list-tool-path ./` that calling `sendEmail --new-list` would in this use case. The end results creates a new email list in the `lists` folder as `lists/salesTeam.json`. The contents of the file `__sendEmail__salesTeam-names.txt` are:
        ```
        John Apple
        Jane Apple
        ```
        The contents of the file `__sendEmail__salesTeam-emails.txt` are:
        ```
        john@example.com
        jane@example.com
        ```
        The contents of the list file created in `lists/salesTeam.json` would then be:
        ```json
        { 
        "email-list": [
          {
          "email": "john@example.com",
          "name": "John Apple"
          },
          {
          "email": "jane@example.com",
          "name": "Jane Apple"
          }
          ]
        }
        ```

  ### `sendEmail` Options

()=> #search:file `docs/sendEmail.md

()=> start-shorthand
()=> options will have a type, reuse types when needed
()=> if type for option cannot be reused, then create new type for that option
()=> example from THIS.prompt
  - --new-list [argument]:string
  - --list-tool-path [path]:string | best type for files and folders
()=> Use `docs/sendEmails.txt` for help with creating new option, but don't limit options to those, and **DO NOT** use "/" DOS syntax for options **EXCEPT for `/?`**
()=> Extensibly document the options, making a verbose `md` file in `docs` that will be an option guide only, providing real world use examples
()=> Have a **cheat-sheet** version for option documentation also
()=>end-shorthand

## Additional Considerations

Below is more or less for idea consideration, email common uses, possible new features to include in the `TODO.md`, but do not use in regards to making the core functionality of the initial tool. These are more or less from a brainstorm with the collaborator.

### Email Use Considerations

- Attachments
- Messages
- Tasks
- Scheduling
- Rescheduling
- Confirming
- Denying
- Request data
- Send data
- Say your late
- Say you'll be early
- Notify
- Newsletters
- Out of office
- Answer questions
- Keep in touch
- Check in

### Email Templating Considerations

- HTML
- Images
- No external `style` tags
  - May be best to use embedded styles per tag
- Absolutely no `JavaScript` in the email data
- Attachments
- Lists
- Paths
- Where command is called

### Organizing Repetitive Emails

- Categories
- Filtering
- Attachment types
- Inline attachment types

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