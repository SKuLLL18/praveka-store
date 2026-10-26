PRAVEKA LIFE SCIENCE - WEBSITE + BACKEND

FILES
server.js            The backend (products, orders, admin login, forms).
package.json         Lists the server libraries (Express, compression and multer).
.env.example         Copy to .env and set your admin password.
public/index.html    Website text and layout.
public/style.css     Colours and layout.
public/script.js     Website behaviour (cart, checkout, search).
public/products.js   Backup product list (used only if the server is off).
public/admin.html    Admin page (opens at /admin).
data/products.json   Your products (managed from the admin page).
data/crops.json      Crop guides used by both the website and SEO pages.
data/orders.json     Created automatically when the first order arrives.
data/visits.json     Created automatically; starts at 50,000 and increments on each website page load.
data/uploads/products Product photos and videos uploaded from the admin page.

SEO ROUTES
GET /products           Server-rendered directory of all visible products.
GET /products/:id       Server-rendered product details and metadata.
GET /crops              Server-rendered directory of all crop guides.
GET /crops/:slug        Server-rendered crop guide and matching products.
GET /category/:slug     Server-rendered category product listing.
GET /buy/:id            Redirects to the interactive product enquiry view.
GET /sitemap.xml        Dynamic sitemap for the homepage, products, crops and categories.
GET /api/crops          Crop data used by the interactive website.

PERSISTENT PRODUCT PHOTOS AND VIDEOS
Admin uploads are saved in DATA_DIR/uploads/products. Locally, DATA_DIR defaults
to this project's data/ folder. On Render, attach a persistent disk mounted at
/var/data and set the service environment variable DATA_DIR=/var/data. The
photos and videos saved on that disk will remain available across redeploys.
Files outside a persistent disk may be removed when the service is redeployed.

MAP ATTRIBUTION
The India state map in public/images/india-states-map.svg is adapted from
svg-maps (MapSVG), packages/india, licensed under CC BY 4.0:
https://github.com/VictorCazanave/svg-maps/tree/master/packages/india

RUN (first time)
1. Install Node.js (LTS) from nodejs.org.
2. Open this folder in VS Code, then Terminal > New Terminal.
3. Run:   npm install
4. Copy .env.example to .env, then open .env and set ADMIN_PASSWORD.
5. Run:   npm start
6. Website: http://localhost:3000    Admin: http://localhost:3000/admin
Stop the server with Ctrl+C. Next time only step 5 is needed.
