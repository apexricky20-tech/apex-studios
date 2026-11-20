// Runs before the app starts. It is a file, not an inline script, so the Content-Security-Policy
// in public/_headers can forbid inline scripts altogether.
;(function () {
  // The plain-text version of the page is only for crawlers and the moment before the app loads.
  // Remove it if it belongs to a different path than the one in the address bar.
  var s = document.querySelector('.shell, .shell-hero')
  if (s && s.getAttribute('data-path') !== (location.pathname.replace(/\/+$/, '') || '/')) s.remove()
  // The home page's first screen is already in the HTML (see homeShell in scripts/seo.mjs). Tell the app,
  // so its intro animations do not replay over a picture the visitor is already looking at.
  else if (s && s.className.indexOf('shell-hero') > -1) document.documentElement.setAttribute('data-shell', '1')

  // Load the font stylesheet without blocking the first paint (the <noscript> tag covers no-JS visitors).
  var links = document.querySelectorAll('link[data-async-css]')
  for (var i = 0; i < links.length; i++) links[i].rel = 'stylesheet'
})()
