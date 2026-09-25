# NAZORA

Ayollar uchun moda va go'zallik do'koni sahifasi.

## Ishga tushirish

Node.js 18+ kerak, boshqa paket o'rnatish shart emas.

```bash
node server.js
# http://localhost:3000
```

Telegram sozlanmagan bo'lsa, server **DEMO rejimda** ishlaydi: buyurtmalar
Telegram'ga yuborilmaydi, faqat terminalga chiqariladi.

## Haqiqiy buyurtmalar uchun

Maxfiy ma'lumotlar faqat serverda, muhit o'zgaruvchilarida saqlanadi:

```bash
TELEGRAM_BOT_TOKEN=123:abc \
TELEGRAM_CHAT_ID=-100123456 \
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec \
node server.js
```

`GOOGLE_SHEETS_WEBHOOK_URL` ixtiyoriy. Telegram'ga yuborish muvaffaqiyatsiz
bo'lsa, mijozga xato ko'rsatiladi va buyurtma "qabul qilindi" deb chiqmaydi.

## Fayllar

- `index.html` — sahifa
- `products.js` — mahsulotlar ro'yxati (sahifa va server birgalikda ishlatadi)
- `server.js` — sahifani beradi va `/api/order` orqali buyurtmalarni qabul qiladi
