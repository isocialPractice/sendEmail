# Example Email List

This could be used to send to all, or loop through list and send one by one.

()=> TO SEND TO ALL ON LIST IN ONE EMAIL
()=> --email-list "<listName>" --send-all

()=> TO SEND TO EACH ONE ON LIST ONE AT A TIME
()=> --email-list "<listName>" --send-loop

()=> ```json
{
 "email-list": [
  {
  "email": "john_a@site.com",
  "name": "John Apple"
  },
  {
  "email": "jane_a@site.com",
  "name": "Jane Apple"
  },
  {
  "email": "john_b@site.com",
  "name": "John Bob"
  },
  {
  "email": "jane_b@site.com",
  "name": "Jane Bob"
  },
  {
  "email": "john_c@site.com",
  "name": "John Cap"
  },
  {
  "email": "jane_c@site.com",
  "name": "Jane Cap"
  },
  {
  "email": "johndoe@site.com",
  "name": "John Doe"
  },
  {
  "email": "janedoe@site.com",
  "name": "Jane Doe"
  }
 ]
}
```
