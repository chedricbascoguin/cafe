// Products (uses inline SVGs as thumbnails)
const PRODUCTS = [
  { id: 1, name: "Burger Mozza XL", price: 39.00, category: "snacks", img: "data:image/svg+xml;utf8," + encodeURIComponent(svgBurger()) },
  { id: 2, name: "Latte", price: 4.00, category: "coffee", img: "data:image/svg+xml;utf8," + encodeURIComponent(svgCoffee()) },
  { id: 3, name: "Espresso", price: 3.50, category: "coffee", img: "data:image/svg+xml;utf8," + encodeURIComponent(svgCoffeeSmall()) },
  { id: 4, name: "Green Tea", price: 2.50, category: "tea", img: "data:image/svg+xml;utf8," + encodeURIComponent(svgTea()) },
  { id: 5, name: "Croissant", price: 3.00, category: "pastry", img: "data:image/svg+xml;utf8," + encodeURIComponent(svgPastry()) },
  { id: 6, name: "Chilli Fried Burger", price: 39.00, category: "snacks", img: "data:image/svg+xml;utf8," + encodeURIComponent(svgBurger()) },
  { id: 7, name: "Cookie", price: 1.50, category: "pastry", img: "data:image/svg+xml;utf8," + encodeURIComponent(svgCookie()) }
];

const menuGrid = document.getElementById("menuGrid");
const cartList = document.getElementById("cartList");
const subTotalEl = document.getElementById("subTotal");
const totalEl = document.getElementById("total");

let cart = {}; // id -> {product, qty}
// const DELIVERY = 3.00; // removed delivery fee

// --- IndexedDB (simple promise wrapper) ---
const DB_NAME = "mi_amore_db";
const DB_VERSION = 1;
const STORE_PRODUCTS = "products";
const STORE_ORDERS = "orders";
let db = null;

function openDb() {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (ev) => {
      const idb = ev.target.result;
      if (!idb.objectStoreNames.contains(STORE_PRODUCTS)) {
        idb.createObjectStore(STORE_PRODUCTS, { keyPath: "id" });
      }
      if (!idb.objectStoreNames.contains(STORE_ORDERS)) {
        idb.createObjectStore(STORE_ORDERS, { keyPath: "orderId", autoIncrement: true });
      }
      // seed products (if desired) using the upgrade transaction
      try {
        const tx = ev.target.transaction;
        const prodStore = tx.objectStore(STORE_PRODUCTS);
        PRODUCTS.forEach(p => prodStore.put(p));
      } catch (e) { /* ignore seeding errors */ }
    };
    req.onsuccess = (ev) => { db = ev.target.result; resolve(db); };
    req.onerror = (ev) => reject(ev.target.error);
  });
}

async function idbPut(storeName, value) {
  const d = db || await openDb();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbAdd(storeName, value) {
  const d = db || await openDb();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.add(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll(storeName) {
  const d = db || await openDb();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// initialize DB
openDb().catch(err => console.error("IDB open error:", err));

// helper to get cart items and subtotal
function getCartItems() {
  return Object.values(cart).map(ci => ({
    id: ci.product.id,
    name: ci.product.name,
    price: ci.product.price,
    qty: ci.qty
  }));
}
function calculateSubtotal(cartItems) {
  return cartItems.reduce((s, it) => s + (it.price * it.qty), 0);
}

function format(n){ return "$" + n.toFixed(2); }

function renderProducts(filter = "all", query = "") {
  menuGrid.innerHTML = "";
  const q = query.trim().toLowerCase();
  const filtered = PRODUCTS.filter(p => (filter === "all" || p.category === filter) && (p.name.toLowerCase().includes(q) || q === ""));
  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="thumb"><img src="${p.img}" alt="${p.name}" /></div>
      <h4>${p.name}</h4>
      <div class="meta">
        <div class="desc"><small>${p.category}</small></div>
        <div class="price">${format(p.price)}</div>
      </div>
      <div class="add-row">
        <small>Best seller</small>
        <button class="add" data-id="${p.id}">ADD</button>
      </div>
    `;
    menuGrid.appendChild(card);
  });
  // attach handlers
  document.querySelectorAll(".add").forEach(btn => {
    btn.addEventListener("click", e => {
      const id = Number(btn.getAttribute("data-id"));
      addToCart(id);
      btn.animate([{ transform: "scale(1.0)" }, { transform: "scale(0.98)" }, { transform: "scale(1.0)" }], { duration: 200 });
    });
  });
}

function addToCart(id){
  const product = PRODUCTS.find(p => p.id === id);
  if(!product) return;
  if(!cart[id]) cart[id] = { product, qty: 0 };
  cart[id].qty++;
  renderCart();
}

function renderCart(){
  cartList.innerHTML = "";
  let subtotal = 0;
  Object.values(cart).forEach(ci => {
    const p = ci.product;
    const qty = ci.qty;
    subtotal += p.price * qty;

    const node = document.createElement("div");
    node.className = "cart-item";
    node.innerHTML = `
      <div class="c-thumb"><img src="${p.img}" alt="${p.name}" /></div>
      <div class="c-info">
        <h5>${p.name}</h5>
        <small>${format(p.price)} • x${qty}</small>
      </div>
      <div class="qty">
        <button class="dec" data-id="${p.id}">-</button>
        <div style="min-width:30px;text-align:center">${qty}</div>
        <button class="inc" data-id="${p.id}">+</button>
      </div>
      <button class="remove" data-id="${p.id}">✕</button>
    `;
    cartList.appendChild(node);
  });

  // attach handlers
  cartList.querySelectorAll(".inc").forEach(b => b.addEventListener("click", e => { const id=+b.dataset.id; cart[id].qty++; renderCart(); }));
  cartList.querySelectorAll(".dec").forEach(b => b.addEventListener("click", e => { const id=+b.dataset.id; cart[id].qty = Math.max(0, cart[id].qty-1); if(cart[id].qty===0) delete cart[id]; renderCart(); }));
  cartList.querySelectorAll(".remove").forEach(b => b.addEventListener("click", e => { const id=+b.dataset.id; delete cart[id]; renderCart(); }));

  subTotalEl.textContent = format(subtotal);
  const total = subtotal; // no delivery
  totalEl.textContent = format(total);
}

// search
document.getElementById("search").addEventListener("input", (e) => {
  const q = e.target.value;
  const active = document.querySelector(".nav-btn.active").dataset.cat || "all";
  renderProducts(active, q);
});

// categories
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderProducts(btn.dataset.cat, document.getElementById("search").value);
  });
});

// initial render
renderProducts();

// -----------------------
// Inline SVG helpers
// -----------------------
function svgCoffee(){
  return `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>
    <defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='#ffd89b'/><stop offset='1' stop-color='#f46b45'/></linearGradient></defs>
    <rect width='100%' height='100%' rx='12' fill='#fff'/>
    <g transform='translate(40,40)'>
      <rect x='0' y='40' width='220' height='120' rx='18' fill='#f6f0eb' stroke='#f2e6df'/>
      <ellipse cx='160' cy='38' rx='68' ry='22' fill='url(#g)' opacity='0.9'/>
      <rect x='190' y='70' width='36' height='64' rx='12' fill='#fff' stroke='#f2e6df'/>
    </g>
  </svg>`;
}

function svgCoffeeSmall(){
  return `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>
    <rect width='100%' height='100%' rx='12' fill='#fff'/>
    <g transform='translate(60,40)'>
      <circle cx='60' cy='60' r='44' fill='#f2cfa6'/>
      <rect x='110' y='60' width='36' height='56' rx='10' fill='#fff' />
    </g>
  </svg>`;
}

function svgTea(){
  return `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>
    <rect width='100%' height='100%' rx='12' fill='#fff'/>
    <g transform='translate(40,36)'>
      <rect x='10' y='28' width='160' height='96' rx='10' fill='#e8f7ea'/>
      <path d='M20 45 C40 30,120 30,140 45' stroke='#c5e6c6' stroke-width='6' fill='none'/>
    </g>
  </svg>`;
}

function svgPastry(){
  return `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>
    <rect width='100%' height='100%' rx='12' fill='#fff'/>
    <g transform='translate(30,30)'>
      <ellipse cx='90' cy='90' rx='70' ry='42' fill='#f6d9b3'/>
      <ellipse cx='60' cy='70' rx='16' ry='10' fill='#d49a6a' opacity='0.9'/>
      <ellipse cx='120' cy='70' rx='16' ry='10' fill='#d49a6a' opacity='0.9'/>
    </g>
  </svg>`;
}

function svgCookie(){
  return `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>
    <rect width='100%' height='100%' rx='12' fill='#fff'/>
    <g transform='translate(50,40)'>
      <circle cx='80' cy='90' r='48' fill='#f4c686'/>
      <circle cx='68' cy='78' r='6' fill='#8b5a3c'/>
      <circle cx='92' cy='105' r='5' fill='#8b5a3c'/>
      <circle cx='100' cy='80' r='5' fill='#8b5a3c'/>
    </g>
  </svg>`;
}

function svgBurger(){
  return `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>
    <rect width='100%' height='100%' rx='12' fill='#fff'/>
    <g transform='translate(36,34)'>
      <ellipse cx='96' cy='140' rx='96' ry='18' fill='#f4d3a3' opacity='0.9'/>
      <rect x='10' y='46' width='172' height='40' rx='18' fill='#f9b88f' />
      <rect x='20' y='86' width='152' height='30' rx='8' fill='#d9663b' />
      <rect x='24' y='56' width='140' height='12' rx='6' fill='#b9e77c' />
    </g>
  </svg>`;
}

function formatCurrency(n) {
    return '$' + n.toFixed(2);
}

function generateReceiptHtml(cartItems, subtotal) {
  const rows = cartItems.map(item => `
    <tr>
      <td style="padding:6px">${item.name} x${item.qty}</td>
      <td style="padding:6px;text-align:right">${formatCurrency(item.price * item.qty)}</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <title>Mi Amore — Receipt</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111}
          table{width:100%;border-collapse:collapse}
          hr{margin:12px 0}
        </style>
      </head>
      <body>
        <h2>Mi Amore</h2>
        <p>Thank you for your order</p>
        <table>
          ${rows}
        </table>
        <hr />
        <table style="width:100%">
          <tr>
            <td>Sub Total</td>
            <td style="text-align:right">${formatCurrency(subtotal)}</td>
          </tr>
          <tr>
            <td><strong>Total</strong></td>
            <td style="text-align:right"><strong>${formatCurrency(subtotal)}</strong></td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function printReceipt(cartItems, subtotal) {
  const printWindow = window.open('', '_blank', 'width=600,height=800');
  printWindow.document.open();
  printWindow.document.write(generateReceiptHtml(cartItems, subtotal));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  // printWindow.close(); // optional
}

// Ensure checkout calls printReceipt and uses subtotal as total (no delivery)
document.getElementById('checkout').addEventListener('click', function () {
  const cartItems = getCartItems(); // ...existing function that returns cart items...
  const subtotal = calculateSubtotal(cartItems); // ...existing subtotal calculation...
  printReceipt(cartItems, subtotal);
});

// replace checkout handler to save order to DB and print
document.getElementById("checkout").replaceWith(document.getElementById("checkout").cloneNode(true));
document.getElementById("checkout").addEventListener("click", async () => {
  if (Object.keys(cart).length === 0) { alert("Your cart is empty."); return; }
  const cartItems = getCartItems();
  const subtotal = calculateSubtotal(cartItems);

  try {
    await openDb(); // ensure DB is opened and stores exist
    const order = {
      createdAt: new Date().toISOString(),
      items: cartItems,
      subtotal: subtotal,
      total: subtotal
    };
    const orderId = await idbAdd(STORE_ORDERS, order);
    printReceipt(cartItems, subtotal);
    cart = {};
    renderCart();
    alert("Order saved (id: " + orderId + ").");
  } catch (err) {
    console.error("Failed to save order:", err);
    alert("Could not save order. Check console for details.");
  }
});
