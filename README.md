# formstack-alpha-theme
Code committed custom Formstack theme for alpha.austin.gov

# Gotchas
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
