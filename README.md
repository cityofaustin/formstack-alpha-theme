# formstack-alpha-theme
Custom Formstack theme for forms embedded on alpha.austin.gov

# Why?
Our Formstack custom theme requirements extend beyond basic styling tweaks. We inject custom html, js, and css that we need to manage in an organized way. This repo uses the Handlebars templating engine to generate Formstack-compatible Header HTML to use on forms embedded on the City of Austin website.

Using git version control on our Formstack theme allows us to protect our styles against accidental deletion and breaking changes. We can easily revert to working versions and track who added changes and why.

We also gain the benefit of using our own developer IDEs and external libraries to construct our Formstack theme. This can help improve the readability of our theme. By using Handlebars templating we can easily deduce which custom pieces of code we're adding to our template. If the Formstack API ever changes, we'll know which pieces we need to port over.

# Where?
The generated Header HTML is located at [build/alpha_theme_header.html](build/alpha_theme_header.html)

If you want to use it, copy and paste it into the "Header HTML" under the "Advanced Code Editor" in you Theme Editor.
<img
src="docs/images/header_html_tab.png"
alt-text="Header HTML tab" width="400" >

Then enable it by entering "Save and activate" under "Save Changes".
<img
src="docs/images/save_and_activate.png"
alt-text="Save and activate" width="400" >

# How?

# Wait, what?
There are some gotchas to watch out for. When you edit Formstack themes using the GUI or the "CSS" tab in the "Advanced Code Editor", the Formstack theme will render exactly as expected. However, when editing Header HTML code directly (as we're doing), there are some non-obvious bugs to watch out for.
### css within \<style\> tags must NOT be indented in order to be compiled by Formstack.
Only this works:
```
<head>
    <style type="text/css">
/* Default styles */
body {
    background-color: #ffffff;
}
    </style>
    <style type="text/css">
/* Override styles */
body {
    background-color: #ffffff;
}
    </style>
</head>
```
Despite being valid html, the following will not work:
```
<head>
    <style type="text/css">
        /* Default styles */
        body {
            background-color: #ffffff;
        }
    </style>
    <style type="text/css">
        /* Override styles */
        body {
            background-color: #ffffff;
        }
    </style>
</head>
```


If the content with a \<style\> tag is indented, then the formstack compiler will break. Not only will your styles not render, the entire form will not render.

That's why our template does not indent handlebar partials within the \<style\> tag:
```
  <head>
    <style type="text/css">
{{> overrideStyles }}
    </style>
  </head>
```

An aside for Formstack developers: if there's only one css style tag, then having the css aligned with the script tag will work:
```
<head>
  <style type="text/css">
  body {
      background-color: #ffffff;
  }
  </style>
</head>
```
But once there are two \<style\> tags, the css for both must be all the way left aligned.
