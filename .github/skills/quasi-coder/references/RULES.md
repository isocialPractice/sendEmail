# RULES

Global rules for all prompts.

## Global Rules

### DO NOT

- **DO NOT CHANGE** or edit `C:\Users\johnh\Batch Files\sendEmails` which the tool being created - `sendEmail` is based from
- **DO NOT CHANGE ANY FILE LOCATED IN** `C:\Users\johnh\Batch Files`, but do read them
- **DO NOT** reference any of the files from #fileSearch `C:\Users\johnh\Batch Files\.*` in the **documentation**
- **DO NOT** copy ANY files from the `config` folder when the option `-c, --copy` is used, but do create the new BLANK template for the copied instance of the tool with essential template data ready to be filled in
- **DO NOT** make the `sendEmail` tool JavaScript
- **DO NOT** use insecure practices or cut-corners
- **DO NOT** use default error messages, unmapped, or use error messages without a custom error type and custom error message for all reasonable error in this regards
- **DO NOT** forget that the collaborator has **NO KNOWLEDGE** at all about how to setup a mock email server for testing

### DO

- **DO** perform an initial #fileSearch "C:\Users\johnh\Batch Files\sendEmails" which the tool being created - `sendEmail` is based from
  - Familarize your self with these, tools, and read through them **once** per chat, but as chat progresses do not read through them again after future prompts
- **DO** perform an initial #fileSearch "C:\Users\johnh\Batch Files\bin", which is in the user path and has executables and library tools the batch file tool "sendEmails" utilizes, which the tool being created - `sendEmail` is based from
  - Familarize your self with these, tools, and read through them **once** per chat, but as chat progresses do not read through them again after future prompts
- **DO** perform an initial #fileSearch "C:\Users\johnh\Batch Files\bin\batApp.bat" can call the batch file tool "sendEmails", which the tool being created - `sendEmail` is based from
  - Familarize your self with these, tools, and read through them **once** per chat, but as chat progresses do not read through them again after future prompts
- **DO** allow the ability for one config file to be used that will specify all required parameters for the tool `sendEmail`
- **DO** consider RFC documentation when making the `sendEmail` tool
- **DO** only copy the essential tool elements when the option `-c, --copy` is used, and do not include any of the configurred files from the `config` folder, but do create **BLANK** template files in the `config` folder using a function that creates duplicate template data with the configuration elements ready to be filled in.
- **DO** make the `sendEmail` tool TypeScript
- **DO** use best email and network security practices without cutting any corners
- **DO** use custom error messages, mapped error data, and custom error types that throw a custom, clean, and helpful error message for all reasonable errors in this regards
- **DO** remember that the collaborator has no knowledge at all about how to setup a **MOCK EMAIL SERVER** for testing