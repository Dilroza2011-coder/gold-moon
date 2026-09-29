// Gold MooN — site, order endpoint and admin panel. No dependencies (Node 18+).
//
// Secrets live only here, read from environment variables:
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GOOGLE_SHEETS_WEBHOOK_URL, ADMIN_PASSWORD
// If Telegram isn't configured the server runs in DEMO mode: orders are
// printed to the console instead of being sent.
//
// Runtime data lives in data/ (not in git, so `git pull` never overwrites it):
//   data/products.json      — the catalog, seeded from products.js on first run
//   data/uploads/           — photos uploaded from the admin panel
//   data/admin-password.txt — generated admin password when ADMIN_PASSWORD is unset

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GOOGLE_SHEETS_WEBHOOK_URL } = process.env;
const DEMO = !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID;

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const PASSWORD_FILE = path.join(DATA_DIR, 'admin-password.txt');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const CATEGORIES = ['Kiyim-kechak', 'Kosmetika va parvarish', 'Taqinchoqlar', 'Aksessuarlar'];
const COLLECTIONS = ['Yangiliklar', 'Chegirmalar', 'Bestseller', "To'plamlar"];
const STOCK = ['Mavjud', 'Oz qoldi', 'Buyurtma asosida'];
const GRADIENTS = [
  'linear-gradient(150deg,#E7A9BC,#7A2E43)', 'linear-gradient(150deg,#F0DDA0,#B08A3A)',
  'linear-gradient(150deg,#E3D6EC,#8F6E9C)', 'linear-gradient(150deg,#C9A377,#6E5237)',
  'linear-gradient(150deg,#B7D8CC,#3E6C5E)', 'linear-gradient(150deg,#F5D9A6,#AD8A56)',
];
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/* ---------------- Catalog storage ---------------- */

let PRODUCTS = loadProducts();

function loadProducts() {
  if (fs.existsSync(PRODUCTS_FILE)) return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  const seed = require('./products.js');
  writeProducts(seed);
  return seed;
}

// Write to a temp file and rename, so a crash mid-write can't corrupt the catalog.
function writeProducts(list) {
  const tmp = PRODUCTS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, PRODUCTS_FILE);
}

// Validates admin input and returns a clean product, or { error }.
function normalizeProduct(input, existing) {
  const str = (v, max) => String(v ?? '').trim().slice(0, max);
  const title = str(input.title, 120);
  if (!title) return { error: 'Mahsulot nomini kiriting' };
  if (!CATEGORIES.includes(input.category)) return { error: 'Kategoriyani tanlang' };
  if (!STOCK.includes(input.stock)) return { error: 'Mavjudlik holatini tanlang' };

  const price = Number(input.price);
  if (!Number.isInteger(price) || price <= 0 || price > 1e9) return { error: "Narx musbat butun son bo'lishi kerak" };
  let oldPrice = null;
  if (input.oldPrice !== null && input.oldPrice !== undefined && input.oldPrice !== '') {
    oldPrice = Number(input.oldPrice);
    if (!Number.isInteger(oldPrice) || oldPrice <= price) return { error: 'Eski narx hozirgi narxdan katta bo\'lishi kerak' };
  }

  const sizes = (Array.isArray(input.sizes) ? input.sizes : [])
    .map(s => str(s, 20)).filter(Boolean).slice(0, 12);
  const colors = (Array.isArray(input.colors) ? input.colors : [])
    .map(c => ({ name: str(c && c.name, 40), hex: String(c && c.hex) }))
    .filter(c => c.name && /^#[0-9a-f]{6}$/i.test(c.hex)).slice(0, 12);
  if (!colors.length) return { error: "Kamida bitta rang qo'shing" };

  const image = input.image ? String(input.image) : '';
  if (image && !/^(images|uploads)\/[\w-]+\.(jpe?g|png|webp)$/i.test(image)) return { error: "Rasm manzili noto'g'ri" };

  const product = {
    id: existing ? existing.id : 'p' + crypto.randomBytes(4).toString('hex'),
    title,
    brand: str(input.brand, 80),
    category: input.category,
    collections: (Array.isArray(input.collections) ? input.collections : []).filter(c => COLLECTIONS.includes(c)),
    sizes: sizes.length ? sizes : ['Standart'],
    colors,
    price,
    stock: input.stock,
    desc: str(input.desc, 2000),
    gradient: existing ? existing.gradient : GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
  };
  if (oldPrice) product.oldPrice = oldPrice;
  if (image) product.image = image;
  return { product };
}

/* ---------------- Admin auth ---------------- */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (() => {
  if (fs.existsSync(PASSWORD_FILE)) return fs.readFileSync(PASSWORD_FILE, 'utf8').trim();
  const pw = crypto.randomBytes(6).toString('base64url');
  fs.writeFileSync(PASSWORD_FILE, pw + '\n');
  return pw;
})();
const SESSION_MS = 12 * 60 * 60 * 1000;
const sessions = new Map(); // token -> expiry time

function passwordMatches(given) {
  const a = crypto.createHash('sha256').update(String(given)).digest();
  const b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}

function isAdmin(req) {
  const m = /(?:^|;\s*)gm_admin=([a-f0-9]{64})/.exec(req.headers.cookie || '');
  const expiry = m && sessions.get(m[1]);
  if (!expiry) return false;
  if (expiry < Date.now()) { sessions.delete(m[1]); return false; }
  return true;
}

/* ---------------- Orders ---------------- */

const fmt = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + " so'm";
const escapeHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function validateOrder(body) {
  const product = PRODUCTS.find(p => p.id === body.productId);
  if (!product) return { error: "Mahsulot topilmadi" };
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  if (!name || name.length > 80) return { error: "Ism noto'g'ri" };
  if (!/^\+?[\d\s()-]{7,20}$/.test(phone)) return { error: "Telefon raqam noto'g'ri" };
  if (!product.sizes.includes(body.size)) return { error: "O'lcham noto'g'ri" };
  if (!product.colors.some(c => c.name === body.color)) return { error: "Rang noto'g'ri" };
  return {
    order: {
      product, name, phone,
      size: body.size, color: body.color,
      timestamp: new Date().toISOString(),
    },
  };
}

// HTML parse mode + escaping: customer text can't break the message format.
function telegramText(o) {
  const p = o.product;
  return [
    '🛍 <b>Yangi buyurtma — Gold MooN</b>',
    `Mahsulot: ${escapeHtml(p.title)} (${escapeHtml(p.brand)})`,
    `O'lcham: ${escapeHtml(o.size)} | Rang: ${escapeHtml(o.color)}`,
    `Narxi: ${fmt(p.price)} (naqd)`,
    `Mijoz: ${escapeHtml(o.name)}`,
    `Telefon: ${escapeHtml(o.phone)}`,
    `Vaqt: ${new Date(o.timestamp).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}`,
  ].join('\n');
}

function sheetsRow(o) {
  const p = o.product;
  return {
    sana: o.timestamp,
    mahsulot: p.title,
    brend: p.brand,
    olcham: o.size,
    rang: o.color,
    narx: p.price,
    mijoz_ismi: o.name,
    telefon: o.phone,
  };
}

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`);
}

async function deliver(o) {
  if (DEMO) {
    console.log('[DEMO] Yangi buyurtma:\n' + telegramText(o).replace(/<\/?b>/g, ''));
    return;
  }
  // Telegram is the channel the manager watches, so it must succeed.
  await postJson(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID, text: telegramText(o), parse_mode: 'HTML',
  });
  // The sheet is a log; a failure there shouldn't reject an order already sent.
  if (GOOGLE_SHEETS_WEBHOOK_URL) {
    await postJson(GOOGLE_SHEETS_WEBHOOK_URL, sheetsRow(o))
      .catch(err => console.error('Google Sheets error:', err.message));
  }
}

/* ---------------- HTTP helpers ---------------- */

function send(res, status, body, type = 'application/json; charset=utf-8', headers = {}) {
  res.writeHead(status, { 'Content-Type': type, ...headers });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJson(req) {
  // Requiring JSON keeps plain cross-site form posts out of the admin API.
  if (!/^application\/json/.test(req.headers['content-type'] || '')) throw new Error('not json');
  return JSON.parse((await readBody(req, 100_000)).toString('utf8'));
}

function serveFile(res, file, type) {
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    send(res, 200, data, type);
  });
}

// Magic bytes, so a renamed non-image can't be stored as a photo.
function looksLikeImage(buf, ext) {
  if (ext === 'jpg') return buf[0] === 0xff && buf[1] === 0xd8;
  if (ext === 'png') return buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (ext === 'webp') return buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP';
  return false;
}

/* ---------------- Routes ---------------- */

const PAGES = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/admin': 'admin.html',
};

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  const m = req.method;

  // Public
  if (m === 'GET' && p === '/api/products') return send(res, 200, PRODUCTS);

  if (m === 'POST' && p === '/api/order') {
    let body;
    try { body = JSON.parse((await readBody(req, 10_000)).toString('utf8')); }
    catch { return send(res, 400, { error: "Noto'g'ri so'rov" }); }
    const { order, error } = validateOrder(body);
    if (error) return send(res, 400, { error });
    try {
      await deliver(order);
      return send(res, 200, { ok: true, demo: DEMO });
    } catch (err) {
      console.error('Order delivery failed:', err.message);
      return send(res, 502, { error: 'Buyurtma yuborilmadi' });
    }
  }

  // Admin: login / logout / session check
  if (m === 'POST' && p === '/api/admin/login') {
    let body;
    try { body = await readJson(req); } catch { return send(res, 400, { error: "Noto'g'ri so'rov" }); }
    if (!passwordMatches(body.password || '')) {
      await new Promise(r => setTimeout(r, 800)); // slow down guessing
      return send(res, 401, { error: "Parol noto'g'ri" });
    }
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_MS);
    return send(res, 200, { ok: true }, undefined, {
      'Set-Cookie': `gm_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}`,
    });
  }
  if (m === 'POST' && p === '/api/admin/logout') {
    const t = /(?:^|;\s*)gm_admin=([a-f0-9]{64})/.exec(req.headers.cookie || '');
    if (t) sessions.delete(t[1]);
    return send(res, 200, { ok: true }, undefined, { 'Set-Cookie': 'gm_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  }
  if (p.startsWith('/api/admin/')) {
    if (!isAdmin(req)) return send(res, 401, { error: 'Qayta kiring' });

    if (m === 'GET' && p === '/api/admin/me') {
      return send(res, 200, { ok: true, categories: CATEGORIES, collections: COLLECTIONS, stock: STOCK });
    }

    if (m === 'POST' && p === '/api/admin/upload') {
      const ext = IMAGE_TYPES[(req.headers['content-type'] || '').split(';')[0]];
      if (!ext) return send(res, 400, { error: 'Faqat JPG, PNG yoki WEBP rasm yuklash mumkin' });
      let buf;
      try { buf = await readBody(req, 8 * 1024 * 1024); }
      catch { return send(res, 413, { error: 'Rasm 8 MB dan katta' }); }
      if (!looksLikeImage(buf, ext)) return send(res, 400, { error: 'Fayl rasm emas' });
      const name = crypto.randomBytes(8).toString('hex') + '.' + ext;
      fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
      return send(res, 200, { image: 'uploads/' + name });
    }

    if (m === 'POST' && p === '/api/admin/products') {
      let body;
      try { body = await readJson(req); } catch { return send(res, 400, { error: "Noto'g'ri so'rov" }); }
      const { product, error } = normalizeProduct(body);
      if (error) return send(res, 400, { error });
      PRODUCTS = [product, ...PRODUCTS];
      writeProducts(PRODUCTS);
      return send(res, 200, product);
    }

    const one = /^\/api\/admin\/products\/([\w-]+)$/.exec(p);
    if (one) {
      const idx = PRODUCTS.findIndex(x => x.id === one[1]);
      if (idx === -1) return send(res, 404, { error: 'Mahsulot topilmadi' });
      if (m === 'PUT') {
        let body;
        try { body = await readJson(req); } catch { return send(res, 400, { error: "Noto'g'ri so'rov" }); }
        const { product, error } = normalizeProduct(body, PRODUCTS[idx]);
        if (error) return send(res, 400, { error });
        PRODUCTS = PRODUCTS.map((x, i) => (i === idx ? product : x));
        writeProducts(PRODUCTS);
        return send(res, 200, product);
      }
      if (m === 'DELETE') {
        PRODUCTS = PRODUCTS.filter((_, i) => i !== idx);
        writeProducts(PRODUCTS);
        return send(res, 200, { ok: true });
      }
    }
    return send(res, 404, { error: 'Not found' });
  }

  // Files
  const img = m === 'GET' && /^\/(images|uploads)\/([\w-]+\.(jpe?g|png|webp))$/i.exec(p);
  if (img) {
    const dir = img[1] === 'images' ? path.join(__dirname, 'images') : UPLOAD_DIR;
    return serveFile(res, path.join(dir, img[2]), MIME[img[3].toLowerCase()]);
  }
  if (m === 'GET' && PAGES[p]) return serveFile(res, path.join(__dirname, PAGES[p]), 'text/html; charset=utf-8');
  send(res, 404, 'Not found', 'text/plain; charset=utf-8');
}

http.createServer((req, res) => {
  handle(req, res).catch(err => {
    console.error(err);
    if (!res.headersSent) send(res, 500, { error: 'Server xatosi' });
  });
}).listen(PORT, () => {
  console.log(`Gold MooN: http://localhost:${PORT}${DEMO ? '  (DEMO rejim — Telegram sozlanmagan)' : ''}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  if (!process.env.ADMIN_PASSWORD) console.log(`Admin paroli: ${ADMIN_PASSWORD}  (data\\admin-password.txt faylida saqlangan)`);
});
