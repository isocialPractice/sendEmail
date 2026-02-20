# Example Email HTML

Template example for email messages in `config/emails/<emailName>/html/<fileName.htm>`

()=> TEMPLATE text like `CH-EMAILONLIST` would be replace(CH-EMAILONLIST, (email-list.name[i] | data passed to option)
()=> EXAMPLE OF USING AN OPTION TO UPDATED TEMPLATE NAME
()=> --hello-name [ [recipient-first-name] [recipient-last-name] [recipient-full-name] [recipient-business-name] ] | "John Doe"
()=> when options like `--hello-name` have a variable or their own argument, then this would be an additional property in an email list object
()=> currently the email list only have two properties, but this can be fine-tuned later to add and look for additional properties
()=> bur right now account for conventional "email contact" properties i.e. whe exporting contacts from gmail.

()=> Sample Template
```html
<p>Hello CH-EMAILONLIST,</p>
<p style='margin-top:1px'>
 Attached is your bill statement and/or update for the week. <br>
 Below is a summary:
</p>
<img alt='summary'
 style='margin-left:10px'
 src='cid:img@example.com'/><br>

<p style='margin-top:-10px'>
 Please mail your payment to:
</p>
<p style='margin-top: -15px; margin-left: 40px; color: gray'>
 Company Name<br>
 P.O. Box 123<br>
 Another Town, ST 45678
</p>

<p>Thanks, and have a great week!</p>

<p style='margin-left: 73px'>Take Care,</p>

<img alt='logo'
 style='margin-top: 20px; margin-left: 30px; width: 60px; height: 71px'
 src='cid:logo@example.com'/><br>

<div
 style='margin-top: 10px; margin-left: 30px; color:gray'>
 <p>
  Email:
   <a style='color: gray' target='_blank' rel='noopener noreferrer' data-auth='NotApplicable' href='mailTo:'>name@example.com</a><br>
  Website:
   <a style='color: gray' target='_blank' rel='noopener noreferrer' data-auth='NotApplicable' href='https://www.example.com'>https://www.example.com</a>
 </p>

 <p>
  Office Phone: (555) 555-1234<br>
  Mobile Phone: (555) 555-1236<br>
  Fax Number: (555) 555-1235
 </p>

 <span>
  <b><u>Mailing Address</u></b><br>
  P.O. Box 123<br>
  Another Town, ST 45678

  <br><br>

  <b><u>Business Location</u></b><br>
  1010 ST-0<br>
  Out of Town, ST 12345<br>
 </span><br>

<!--
----------------------------------------------------------------------
  Put in a tag or embed if linkable map location (i.e. Google map).
----------------------------------------------------------------------
-->
 <img alt="map"
  style="width: 225px; height: 226px"
  src='cid:map@example.com'/>

</div>
```
