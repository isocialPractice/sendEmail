# `sendEmail` -h, --help

> [!NOTE]
> We want to use `/?` to display help, but not include it as this tool should be able to hand sloppy usage, which would require the help doc.

The below will work as a starting poing for documentation, use, and options.

## `sendEmail` Documentation Starting Point and Consideration

```text
sendEmail

Command-line tool to send an email, or automate repetitive emails.

Usage: sendEmail  [options] [script.js] [configuration.json] [arguments]

Terminology
  Use Prioritization         - The tool can be included in the path, and use the configuration elements from where it is located, but in some cases the tool is best suited to be used in another location that is not in the system or user path. In such cases:
                               - The `sendEmail` tool's executable MUST be called where the copied instance of the tool is
                                 - Copied instances of the tool can be created using the `-c, --copy` option with the `[path]` argument being optional
                                 - If the `[path]` argument is excluded, then the copied instance of the tool will be placed in the current working directory
                               - When `sendEmail` is called and the current working directory is a copied instance, the the current copied instance will overrule all elements, features, functions, libraries, configurations, etc. from the `sendEmail` tool located in the path
()=> **IMPORTANT** - do not copy configurred files from the `config` folder when using the `-c, --copy` option as they will contain sensitive data
  Non-configurable Option    - Options that are passed to the command-line tool, but not included in config files
  Configuratble Options      - Options that are passed to the commond-line tool, and included in config files as properties
  Tool Optoins               - Options to turn on tool scripting, which will disable sending of emails for the current command
  Non-configurable Arguments - Arguments passed after an option, or to `sendEmail` that are not included in config files
  Configurable Arguments     - Arguments passed after an option, or to `sendEmail` that are included with configurable option in config files as values

Option Terminology
  Mixed         - Options are allowed to have mixed types, but the final type should be determined after all options and arguments have been processed. Most options will be `type:mixed`
                  Look for [type:mixed] under option's description
  Normal        - Option that triggers normal mode, which is similar to raw but more configurable, but being more strict regarding syntax
                  Look for [type:normal] under option's description
  Null          - Null options are similar to tool options, but have no aggresive features; being instead reproductive, productive, or null. When `type:null` is not reproductive or productive, then the option does not disable or enable any modes, but instead toggles default behaviour on or off
                  Look for [type:null [reproductive] [productive]] under option's description
  Productive    - Options that relate to documentation, or maintenance of the tool. A common use is `-h, --help` and `--log`
                  Look for [type:null <productive>] under option's description
  Raw           - Default mode of the tool, less strict syntax and option use, sending email as raw text data
                  Look for [type:raw] under option's description
  Repetitive    - Option that triggers repetitive send mode, disabling raw and normal, and requiring stricter syntax
                  Look for [type:repetitive] under option's description
  Reproductive  - Options that produced reusable instances of the tool. A common use is `-c, --copy` and `--test`
                  Look for [type:null <reproductive>] under option's description              

Tool Option Terminology:
  Agressive - When labele as type aggresive, this option will trigger tool mode
              Look for [type:aggressive] under option's description
  Passive   - When labeled as type passive, this option requires an aggressive option, else it is ignored
              Look for [type:passive] under option's description

Non-configurable Options:
  Option                      Description
    --account                  Specify the configurred account to use in the `config/accounts` folder
                               [type:mixed]
()=> `config/accounts` folder requires a default, and MUST HAVE the file name `_default` e.g. `config/accounts/_default.js`
    --config-email             A configurred repeating email type in the `config/emails` folder
                               [type:normal] | [type:repetitive]
()=> MAPS TO configurred email
    -c, --copy                 As [1] with path [2]. Copy the root directory to path or current folder if no path
                               NOTE - this option passed as the first argument disables all other options, and will
                                      only accept the `path` argument.
                               [type:null <reproductive>]
    -h, --help                 Display full help documentation by itself, but with an argument displays specific help sections
                               [type:null <productive>]
()=> MAPS TO [doc types]
()=> MAPS TO path
()=> **IMPORTANT** - do not copy configurred files from the `config` folder when using the `-c, --copy` option as they will contain sensitive data
    -f, --force                Force send, and do not prompt with complete email being sent, asking for confirmation
                               [type: null]
    --test                     If passed by itself, a full test will be run. Use an argument to run a unit test
                               [type:null <reproductive>]
()=> MAPS TO unit test
    -t, --text                 Text directly to address with message as option
                               [type: raw]
()=> MAPS TO message text

Configurable Options:
  Option                      Description
    --attach-cid               Content id for an inline image
                               [type: mixed]
()=> sets cid property -> see `EXAMPLE_email.md`
    --attach-file              An attachment file name 
                               [type: null]
()=> sets filename property -> see `EXAMPLE_email.md`
    --attach-path              An attachment path
                               [type: mixed]
()=> sets path property -> see `EXAMPLE_email.md`
    --attach-content-disp      Set attachment content disposition
                               [type: mixed]
                               NOTE - defaults to attachment
()=> sets contentDisposition property -> see `EXAMPLE_email.md`
    --bcc                      Specify the "bcc" recipients of an email
                               [type: mixed]
()=> sets bcc property -> see `EXAMPLE_emailJSON.md`
    --cc                       Specify the "cc" recipients of an email
                               [type: mixed]
()=> sets cc property -> woulb be in `EXAMPLE_emailJSON.md`
    --from-address             Specify the from address
                               [type: mixed]
                               NOTE - if a configurred account is used, this will overrule the from address in the account
()=> sets from property -> see `EXAMPLE_emailJSON.md`
    --message-file             Specify the file to use for the email's message data
                               [type: mixed]
()=> sets (html | text) property by file extension i.e. ".txt" would be `text`, ".html" | ".htm" | similar would be `html`, ".md" would be `html` but use a lightweight markdown to html that is created in the `lib` folder -> see `EXAMPLE_emailJSON.md`
    --message-html             Strict variation of `--message-file` that clearly states the email is html
                               [type: mixed]
()=> sets html property -> see `EXAMPLE_emailJSON.md`
    --message-text             Strict variation of `--message-file` that clearly states the email is text
                               [type: mixed]
()=> sets text property -> see `EXAMPLE_emailJSON.md`
    --reply-to                 Specify the reply-to address of an email
                               [type: mixed]
()=> sets replyTo property -> see `EXAMPLE_emailJSON.md`
    --send-to                  Specify the recipient of the email
                               [type: mixed]
()=> sets to property -> see `EXAMPLE_emailJSON.md`
    --subject                  Specify the data for the email subject field
                               [type: mixed]
()=> sets subject property -> see `EXAMPLE_emailJSON.md`

Tool Options:
  Option                      Description
    --list-tool-path           The folder path to tool files `__sendEmail__<listName>-emails.txt` and `__sendEmail__<listName>-names.txt`
                               [type:passive]
    --new-list                 Create a new email list using tool files
                               [type:aggressive]

Non-configurable Arguments:
  Argument                    Description
    account                    The file name of a configurred account in the `config/accounts` folder
()=> REQUIRES --account
    configurred email          The folder name of a configurred repeating email in the `config/emails` folder
()=> REQUIRES -- config-emmail
    [doc types]                Argument for the `-h, --help` option that ouputs help documentation for specific parts of the tool, which are more verbose with more options than when `-h, --help` is used by itself
                               Acceptable values are:
                                 - `options` - which can be detailed evne further with:
                                   - `options:configurable`
                                   - `options:non-configurable`
                                   - `options:tool`
                                 - `arguments` - which can be detailed evne further with:
                                   - `arguments:configurable`
                                   - `arguments:non-configurable`
()=> REQUIRES -h, --help
    message text               The raw text that is sent in email
()=> REQUIRES -t, --text
    path                       The path to copy sendEmail App to
()=> REQUIRES -c, --copy
    unit test                  The specific unit test to run

Configurable Arguments:
  Argument                    Description
    send to                    The address to send message to
()=> REQUIRES --send-to
    message file               The content that is sent in email
()=> REQUIRES (--message-file | --message-html | --message-text)
    message template           The template content that is sent in an email
    message header             The email header of message
    from address               Set the from address in message
    reply to                   Address used in reply-to email header

 Use Example:
 > sendEmail --send-to "someone@site.com" --from-address "from@site.com" --subject "Message Header" --message-file "message.txt"
   - Send email to "someone@site.com" with from address "from@site.com" with the subject "Message Header", and
     use "message.txt" as the email message.
()=> will use credentionals from `config/accounts/_default.js`

 > sendEmail --acount --text "someone@site.com" "Message in text."
   - Send email to "someone@site.com" with "Message in text." as HTML content.
()=> will use credentionals from `config/accounts/_default.js`

 > sendEmail --acount --text "someone@site.com" "Message in text." --account "jane.js"
   - Send email to "someone@site.com" with "Message in text." as HTML content.
()=> will use credentionals from `config/accounts/jane.js` , if it exist, else throw a custom, clean, and helpful error message

```
