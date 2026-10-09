Tandoori Lounge - review build (v8)
Open index.html (main brand page) in a browser. The Austin site is austin-tandoori-lounge/index.html. Internet is needed for photos, video and the map.
Add ?intro=1 to the home URL to see the preloader again.

LOGO
The logo is a local file: assets/logo.png (456 x 210 px, the original from the old site).
It shows in the preloader, the header and the footer.
To change it, replace assets/logo.png with your file, same name.
For a sharp logo at 800 px wide, use an SVG or a PNG at least 1600 px wide.
If you rename the file, change the LOGO line in build.mjs, or edit the img tag in each page.

Back end is a placeholder (assets/config.js). Put 404.html in the web root.

SITE STRUCTURE
index.html                  main brand page (root). Uses assets/landing.js.
austin-tandoori-lounge/index.html  Austin home. Uses assets/app.js. Footer links back to the main page.
austin-tandoori-lounge-*/     shared inner pages. Logo links to austin-tandoori-lounge/.
Every page loads the same libraries from assets/vendor (GSAP, ScrollTrigger, Lenis). Do not inline copies.
