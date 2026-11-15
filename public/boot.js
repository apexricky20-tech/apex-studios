// Runs before the app starts. It is a file, not an inline script, so the Content-Security-Policy
// in public/_headers can forbid inline scripts altogether.
;(function () {
  // The plain-text version of the page is only for crawlers and the moment before the app loads.
  // Remove it if it belongs to a different path than the one in the address bar.
  var s = document.querySelector('.shell')
  if (s && s.getAttribute('data-path') !== (location.pathname.replace(/\/+$/, '') || '/')) s.remove()

  // Load the font stylesheet without blocking the first paint (the <noscript> tag covers no-JS visitors).
  var links = document.querySelectorAll('link[data-async-css]')
  for (var i = 0; i < links.length; i++) links[i].rel = 'stylesheet'
})()
