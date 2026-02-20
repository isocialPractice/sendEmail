# Help `sendEmail`

This tool is based on an existing batch file tool that is located at "C:\Users\johnh\Batch Files\sendEmails". The existing tool IS NOT TO BE CHANGED. Only read from. DO NOT CHANGE "C:\Users\johnh\Batch Files\sendEmails".

But below is the help that is output when `"C:\Users\johnh\Batch Files\sendEmails\sendEmails.bat" /?` is called:

```text
************************************************************************************************************
sendEmails

Base batch to Send emails.

Usage: sendEmails
       > s  [1] [ [/T] | Send To ]
                         [ [/C] [-c, --copy] ]
                     [2] [ Send To | [Message Text | Message File] ]
                         [ path ]
                     [3] [ Message Header | --close ]
                     [4] [ From Address | --close ]
                     [5] [ Reply To | --close ]
                     [6] [ --close ]

    Parameter List:

    Parameter         Description
      /C               As [1] with path [2]. Copy the root directory to path or current folder if no path.
      /T               Text directly to address with message as option.
      -c, --copy       As [1] with path [2]. Copy the root directory to path or current folder if no path.
      path             As [2] with /C or -c, --copy [2]. The path to copy sendEmails App to.
      Send To          The address to send message to.
      Message Text     The raw text that is sent in email.
      Message File     The content that is sent in email.
      Message Header   The email header of message.
      From Address     Set the from address in message.
      Reply To         Address used in reply-to email header.
      --close          Close the operation without a prompt to check successful sends.


 Use Example:
 > sendEmails "someone@site.com" "from@site.com" "Message Header" "message.txt"
   - Send email to "someone@site.com" with return "from@site.com" with "Message Header"
     with "message.txt" as HTML content.

 > sendEmails /T "someone@site.com" "Message in text."
   - Send email to "someone@site.com" with "Message in text." as HTML content.

 ************************************************************************************************************
```

> [!IMPORTANT]
> The batch script `sendEmails` is different from the tool being made, which is `sendEmail`.
