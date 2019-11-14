/*
  Mock out Formstack's Header HTML postprocessing for preview builds.
  These classNames would added to the <html/> element when compiled by Formstack.
  But we must add them manually when testing on a local Preview.

  ClassNames such as "fsborderradius" are required for some css style overrides to work.
*/

document.documentElement.className = document.documentElement.className + [
  "fsjs",
  "fsflexbox",
  "fsno-touch",
  "fsgeolocation",
  "fsdraganddrop",
  "fsrgba",
  "fsbackgroundsize",
  "fsborderimage",
  "fsborderradius",
  "fsboxshadow",
  "fstextshadow",
  "fsopacity",
  "fscsscolumns",
  "fscssgradients",
  "fsfontface",
  "fsvideo",
  "fsaudio",
  "fslocalstorage",
  "fssessionstorage",
  "fsapplicationcache",
].join(" ");
