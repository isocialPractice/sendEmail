# Example Create Email List Property Emails

This is an example temporary tool file that would help the user easily create a simple email list. A few conditions though:

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
### Example `__sendEmail__<listName>-emails.txt` File

john_a@site.com
jane_a@site.com
john_b@site.com
jane_b@site.com
john_c@site.com
jane_c@site.com
johndoe@site.com
janedoe@site.com
