# Gold MooN

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

- `index.html` — do'kon sahifasi
- `admin.html` — admin panel (`/admin`)
- `server.js` — sahifalarni beradi, buyurtmalarni va admin panel so'rovlarini qabul qiladi
- `products.js` — boshlang'ich mahsulotlar ro'yxati (faqat birinchi ishga tushirishda ishlatiladi)
- `data/` — ish vaqtidagi ma'lumotlar, GitHub'ga yuklanmaydi:
  - `products.json` — admin panelda tahrirlanadigan katalog
  - `uploads/` — admin paneldan yuklangan rasmlar
  - `admin-password.txt` — admin paroli

## Admin panel

`http://localhost:3000/admin` manzilini oching. Parol server oynasida chiqadi va
`data/admin-password.txt` faylida saqlanadi. O'z parolingizni qo'ymoqchi bo'lsangiz,
serverni `ADMIN_PASSWORD=...` muhit o'zgaruvchisi bilan ishga tushiring.

Admin panelda mahsulot qo'shish, tahrirlash, o'chirish, narxni ro'yxatning o'zida
o'zgartirish va mahsulot rasmini yuklash mumkin.
