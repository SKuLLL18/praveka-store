PRAVEKA LIFE SCIENCE - WEBSITE + BACKEND

FILES
server.js            The backend (products, orders, admin login, forms).
package.json         Lists the one library needed (express).
.env.example         Copy to .env and set your admin password.
public/index.html    Website text and layout.
public/style.css     Colours and layout.
public/script.js     Website behaviour (cart, checkout, search).
public/products.js   Backup product list (used only if the server is off).
public/admin.html    Admin page (opens at /admin).
data/products.json   Your products (managed from the admin page).
data/orders.json     Created automatically when the first order arrives.

RUN (first time)
1. Install Node.js (LTS) from nodejs.org.
2. Open this folder in VS Code, then Terminal > New Terminal.
3. Run:   npm install
4. Copy .env.example to .env, then open .env and set ADMIN_PASSWORD.
5. Run:   npm start
6. Website: http://localhost:3000    Admin: http://localhost:3000/admin
Stop the server with Ctrl+C. Next time only step 5 is needed.
