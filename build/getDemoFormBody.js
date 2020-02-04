const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const pretty = require('pretty');
const dotenv = require('dotenv');
dotenv.config();

/*
  **** Optional script for developers ****

  If you want to demo your own form, there are a couple of extra steps.
  You need to use or generate an Access Token from Formstack's API.
  Plug in the FORM_ID of your form and your FORMSTACK_ACCESS_TOKEN into a .env file.
  Run this script to write the body of your form to /src/partials/html/demo_form_body_[FORM_ID].html
*/
console.log(`Fetching form ${process.env.FORM_ID}`)
axios.get(`https://www.formstack.com/api/v2/form/${process.env.FORM_ID}.json`, {
  headers: {
    "Authorization": `Bearer ${process.env.FORMSTACK_ACCESS_TOKEN}`
  }
}).then((res) => {
  const $ = cheerio.load(res.data.html);
  // Strangely, the API doesn't set the "$" for currency fields, even though the real site will render it.
  $(".fsCurrencyPrefix").text('$');
  const body = pretty($("body").html())
  fs.writeFileSync(path.resolve(__dirname, `../src/partials/html/${process.env.DEMO_FORM_BODY_PARTIAL}.html`), body)
  console.log(`New form body written to src/preview/${process.env.DEMO_FORM_BODY_PARTIAL}.html`)
}).catch((err) => {
  console.log(err)
})
