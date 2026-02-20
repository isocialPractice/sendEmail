# RULES for when `make-send-email-tool.prompt.md` is Called

This is an overview of rules to follow when the promt file `make-send-email-tool.prompt.md` has been run.

## Make Send Email Tool Prompt Rules

- For each folder in the code base look for a file name `quasi-coder.instruction.md`, which will provide instructions for that folder
- The final tool must be able to easily integrate or be plugged into an external API. Some examples:
  - An IDE extension:
    - VS Code
    - Visual Studio
    - Neovim
    - JetBrains
    - etc.. (*maybe Notepad++*)

  - A GUI library:
    - python
    - NodeJS
    - C
    - C++
    - C#
    - HTML
    - PHP
    - etc...

  