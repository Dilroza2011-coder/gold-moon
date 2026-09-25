// NAZORA — static site + order endpoint. No dependencies (Node 18+).
//
// Secrets live only here, read from environment variables:
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GOOGLE_SHEETS_WEBHOOK_URL
// If Telegram isn't configured the server runs in DEMO mode: orders are
// printed to the console instead of being sent.

const http = require('http');
const fs = require('fs');
const path = require('path');
const PRODUCTS = require('./products.js');

const PORT = Number(process.env.PORT) || 3000;
const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GOOGLE_SHEETS_WEBHOOK_URL } = process.env;
const DEMO = !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID;

const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/products.js': ['products.js', 'text/javascript; charset=utf-8'],
};

const fmt = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + " so'm";
const escapeHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function validate(body) {
  const product = PRODUCTS.find(p => p.id === body.productId);
  if (!product) return { error: "Mahsulot topilmadi" };
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  if (!name || name.length > 80) return { error: "Ism noto'g'ri" };
  if (!/^\+?[\d\s()-]{7,20}$/.test(phone)) return { error: "Telefon raqam noto'g'ri" };
  if (!product.sizes.includes(body.size)) return { error: "O'lcham noto'g'ri" };
  if (!product.colors.some(c => c.name === body.color)) return { error: "Rang noto'g'ri" };
  if (body.payType !== 'naqd' && body.payType !== 'nasiya') return { error: "To'lov turi noto'g'ri" };
  return {
    order: {
      product, name, phone,
      size: body.size, color: body.color, payType: body.payType,
      timestamp: new Date().toISOString(),
    },
  };
}

// HTML parse mode + escaping: customer text can't break the message format.
function telegramText(o) {
  const p = o.product, i = p.installments;
  const payLine = o.payType === 'nasiya'
    ? `Nasiya: 3 oy — ${fmt(i[3])}, 6 oy — ${fmt(i[6])}, 12 oy — ${fmt(i[12])}`
    : `Naqd/karta: ${fmt(p.cashPrice)}`;
  return [
    '🛍 <b>Yangi buyurtma — NAZORA</b>',
    `Mahsulot: ${escapeHtml(p.title)} (${escapeHtml(p.brand)})`,
    `O'lcham: ${escapeHtml(o.size)} | Rang: ${escapeHtml(o.color)}`,
    `To'lov turi: ${payLine}`,
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
    tolov_turi: o.payType,
    narx: o.payType === 'nasiya' ? p.installments[12] : p.cashPrice,
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

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'POST' && url.pathname === '/api/order') {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 10_000) req.destroy();
    });
    req.on('end', async () => {
      let body;
      try { body = JSON.parse(raw); } catch { return send(res, 400, { error: "Noto'g'ri so'rov" }); }
      const { order, error } = validate(body);
      if (error) return send(res, 400, { error });
      try {
        await deliver(order);
        send(res, 200, { ok: true, demo: DEMO });
      } catch (err) {
        console.error('Order delivery failed:', err.message);
        send(res, 502, { error: 'Buyurtma yuborilmadi' });
      }
    });
    return;
  }

  const file = req.method === 'GET' && STATIC[url.pathname];
  if (!file) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
  fs.readFile(path.join(__dirname, file[0]), (err, data) => {
    if (err) return send(res, 500, 'Server error', 'text/plain; charset=utf-8');
    send(res, 200, data, file[1]);
  });
}).listen(PORT, () => {
  console.log(`NAZORA: http://localhost:${PORT}${DEMO ? '  (DEMO rejim — Telegram sozlanmagan)' : ''}`);
});
