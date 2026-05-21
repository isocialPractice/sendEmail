// email.js
// Custom variables and (optionally) attachments for the 'cmd-flag-example' email.
//
// This template demonstrates the `--template` CLI option which fills `_flag`
// directives declared in the sibling email.json. See docs/TEMPLATING.md for the
// full directive reference.
//
// To enable attachments through the --template system, change the email.json
// "attachments" value to "_flag:default-to=emailAttachments" and uncomment the
// `emailAttachments` export below.

const date = new Date();
const theYear = date.getMonth() === 0 ? '{{dates.lastYear}}' : '{{dates.year}}';

/*
export const emailAttachments = [
  {
    filename: 'placeholder.txt',
    path: 'attachments/placeholder.txt'
  }
];
*/

export const emailVars = {
  theYear
};
