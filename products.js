/* ============================================================
   PRODUCT DATA — shared by index.html and server.js
   ============================================================ */
const PRODUCTS = [
  {
    id: "p1", title: "Shohi ko'ylak", brand: "Zara",
    category: "Kiyim-kechak", collections: ["Yangiliklar","Bestseller"],
    sizes: ["S","M","L"], colors: [{name:"Pushti",hex:"#E7A9BC"},{name:"Bej",hex:"#D8C3A5"},{name:"Fil suyagi",hex:"#F2EDE4"}],
    cashPrice: 480000, installments: {3:180000,6:98000,12:54000},
    stock: "Mavjud", desc: "Yumshoq shohi matodan tikilgan, kunlik va bayram tadbirlari uchun mos ko'ylak.",
    gradient: "linear-gradient(150deg,#E7A9BC,#7A2E43)"
  },
  {
    id: "p2", title: "Trench palto", brand: "Local Brand",
    category: "Kiyim-kechak", collections: ["Yangiliklar"],
    sizes: ["M","L","XL"], colors: [{name:"Beige",hex:"#D9C3A0"},{name:"Qora",hex:"#2A211D"}],
    cashPrice: 890000, installments: {3:330000,6:180000,12:96000},
    stock: "Oz qoldi", desc: "Kuz mavsumi uchun klassik trench palto, ichki astar bilan.",
    gradient: "linear-gradient(150deg,#CBB48C,#5C4630)"
  },
  {
    id: "p3", title: "Vitamin C serum", brand: "GlowLab",
    category: "Kosmetika va parvarish", collections: ["Bestseller"],
    sizes: ["Standart"], colors: [{name:"—",hex:"#F2EDE4"}],
    cashPrice: 165000, installments: {3:62000,6:34000,12:19000},
    stock: "Mavjud", desc: "Terini yorug'lashtiruvchi va nurlantiruvchi vitamin C asosidagi serum, 30ml.",
    gradient: "linear-gradient(150deg,#F5D9A6,#AD8A56)"
  },
  {
    id: "p4", title: "Marvarid uzuk", brand: "Silver&Co",
    category: "Taqinchoqlar", collections: ["To'plamlar"],
    sizes: ["Standart"], colors: [{name:"Kumush",hex:"#D9D9D9"},{name:"Oltin",hex:"#D4AF37"}],
    cashPrice: 245000, installments: {3:92000,6:50000,12:27000},
    stock: "Mavjud", desc: "Tabiiy marvarid bilan bezatilgan zamonaviy uzuk, kundalik va bayramona kiyim uchun.",
    gradient: "linear-gradient(150deg,#E3D6EC,#8F6E9C)"
  },
  {
    id: "p5", title: "Charm sumka", brand: "Local Brand",
    category: "Aksessuarlar", collections: ["Bestseller","Chegirmalar"],
    sizes: ["Standart"], colors: [{name:"Qo'ng'ir",hex:"#7A5230"},{name:"Qora",hex:"#2A211D"},{name:"Bej",hex:"#D8C3A5"}],
    cashPrice: 560000, installments: {3:210000,6:114000,12:60000},
    stock: "Mavjud", desc: "Haqiqiy charmdan tayyorlangan, keng sig'imli kundalik sumka.", oldPrice: 720000,
    gradient: "linear-gradient(150deg,#C9A377,#6E5237)"
  },
  {
    id: "p6", title: "Ipak ro'mol", brand: "Zara",
    category: "Aksessuarlar", collections: ["Yangiliklar"],
    sizes: ["Standart"], colors: [{name:"Pushti gullar",hex:"#E7A9BC"},{name:"Zumrad",hex:"#4E8B7C"}],
    cashPrice: 195000, installments: {3:73000,6:40000,12:22000},
    stock: "Mavjud", desc: "Yengil ipak matodan, gulli naqshli, ko'p variantli bog'lash usullari bilan.",
    gradient: "linear-gradient(150deg,#B7D8CC,#3E6C5E)"
  },
  {
    id: "p7", title: "Matt lab bo'yog'i to'plami", brand: "GlowLab",
    category: "Kosmetika va parvarish", collections: ["Chegirmalar","Bestseller"],
    sizes: ["Standart"], colors: [{name:"—",hex:"#C67B93"}],
    cashPrice: 128000, installments: {3:48000,6:26000,12:15000},
    stock: "Mavjud", desc: "5 xil tabiiy rangdagi, uzoq muddat saqlanadigan matt lab bo'yoqlari to'plami.", oldPrice: 170000,
    gradient: "linear-gradient(150deg,#E3A0B4,#7A2E43)"
  },
  {
    id: "p8", title: "Bilaguzuklar to'plami", brand: "Silver&Co",
    category: "Taqinchoqlar", collections: ["To'plamlar","Yangiliklar"],
    sizes: ["Standart"], colors: [{name:"Oltin",hex:"#D4AF37"},{name:"Kumush",hex:"#D9D9D9"}],
    cashPrice: 175000, installments: {3:66000,6:36000,12:20000},
    stock: "Buyurtma asosida", desc: "3 dona nozik bilaguzukdan iborat to'plam, kundalik kiyinish uchun.",
    gradient: "linear-gradient(150deg,#EAD9A0,#AD8A56)"
  },
  {
    id: "p9", title: "Kashmir sviter", brand: "Local Brand",
    category: "Kiyim-kechak", collections: ["Bestseller"],
    sizes: ["S","M","L","XL"], colors: [{name:"Pastel yashil",hex:"#B9CDB0"},{name:"Bej",hex:"#D8C3A5"},{name:"Lavanda",hex:"#C9BEDD"}],
    cashPrice: 610000, installments: {3:228000,6:124000,12:66000},
    stock: "Mavjud", desc: "Yumshoq kashmir aralashmasidan tayyorlangan, issiq va yengil sviter.",
    gradient: "linear-gradient(150deg,#C6D6BD,#5C7A52)"
  },
  {
    id: "p10", title: "Quyosh ko'zoynak", brand: "Zara",
    category: "Aksessuarlar", collections: ["Yangiliklar"],
    sizes: ["Standart"], colors: [{name:"Qora",hex:"#2A211D"},{name:"Toshbaqa naqsh",hex:"#8A5A2A"}],
    cashPrice: 210000, installments: {3:79000,6:43000,12:23000},
    stock: "Mavjud", desc: "UV himoyali, zamonaviy dizaynli quyosh ko'zoynagi.",
    gradient: "linear-gradient(150deg,#D9C79A,#6E5237)"
  },
  {
    id: "p11", title: "Nam beruvchi krem", brand: "GlowLab",
    category: "Kosmetika va parvarish", collections: ["Yangiliklar"],
    sizes: ["Standart"], colors: [{name:"—",hex:"#F2EDE4"}],
    cashPrice: 142000, installments: {3:53000,6:29000,12:16000},
    stock: "Oz qoldi", desc: "Gialuron kislotali, barcha teri turlariga mos nam beruvchi krem, 50ml.",
    gradient: "linear-gradient(150deg,#F0E4D6,#AD8A56)"
  },
  {
    id: "p12", title: "Zargarlik zanjiri (uzun)", brand: "Silver&Co",
    category: "Taqinchoqlar", collections: ["Chegirmalar"],
    sizes: ["Standart"], colors: [{name:"Oltin",hex:"#D4AF37"}],
    cashPrice: 230000, installments: {3:86000,6:47000,12:25000},
    stock: "Mavjud", desc: "Minimalist uslubdagi uzun zanjir, istalgan liboz bilan mos keladi.", oldPrice: 290000,
    gradient: "linear-gradient(150deg,#EAD9A0,#8A6A2A)"
  }
];

if(typeof module !== 'undefined') module.exports = PRODUCTS;
