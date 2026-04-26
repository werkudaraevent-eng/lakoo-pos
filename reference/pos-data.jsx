// ── Mock Data ──────────────────────────────────────────
const PRODUCTS = [
  { id:1, name:'T-Shirt Basic White', category:'Atasan', price:85000, sku:'TSH-001', sizes:{S:12,M:8,L:5,XL:2}, img:'atasan' },
  { id:2, name:'T-Shirt Stripe Navy', category:'Atasan', price:95000, sku:'TSH-002', sizes:{S:6,M:10,L:4,XL:0}, img:'atasan' },
  { id:3, name:'Polo Basic Black', category:'Atasan', price:120000, sku:'PLO-001', sizes:{S:4,M:7,L:9,XL:3}, img:'atasan' },
  { id:4, name:'Kemeja Linen Cream', category:'Atasan', price:185000, sku:'KMS-001', sizes:{S:3,M:5,L:3,XL:1}, img:'atasan' },
  { id:5, name:'Hoodie Oversize Grey', category:'Atasan', price:250000, sku:'HOD-001', sizes:{S:2,M:4,L:6,XL:5}, img:'atasan' },
  { id:6, name:'Crop Top Ribbed', category:'Atasan', price:75000, sku:'CRP-001', sizes:{S:8,M:6,L:3,XL:0}, img:'atasan' },
  { id:7, name:'Celana Chino Beige', category:'Bawahan', price:175000, sku:'CHN-001', sizes:{'28':4,'30':6,'32':5,'34':3}, img:'bawahan' },
  { id:8, name:'Celana Jogger Black', category:'Bawahan', price:145000, sku:'JGR-001', sizes:{S:5,M:8,L:6,XL:3}, img:'bawahan' },
  { id:9, name:'Rok Mini Pleated', category:'Bawahan', price:130000, sku:'ROK-001', sizes:{S:4,M:5,L:2,XL:0}, img:'bawahan' },
  { id:10, name:'Celana Pendek Cargo', category:'Bawahan', price:155000, sku:'CGO-001', sizes:{S:3,M:6,L:5,XL:4}, img:'bawahan' },
  { id:11, name:'Jacket Bomber Olive', category:'Outerwear', price:350000, sku:'JCK-001', sizes:{S:2,M:3,L:4,XL:2}, img:'outerwear' },
  { id:12, name:'Cardigan Knit Cream', category:'Outerwear', price:280000, sku:'CDG-001', sizes:{S:3,M:4,L:3,XL:1}, img:'outerwear' },
  { id:13, name:'Tote Bag Canvas', category:'Aksesoris', price:65000, sku:'TOT-001', sizes:{One:20}, img:'aksesoris' },
  { id:14, name:'Bucket Hat Beige', category:'Aksesoris', price:95000, sku:'HAT-001', sizes:{One:12}, img:'aksesoris' },
  { id:15, name:'Kaus Kaki Set 3pcs', category:'Aksesoris', price:45000, sku:'SOK-001', sizes:{One:30}, img:'aksesoris' },
];

const TRANSACTIONS = [
  { id:'TRX-0248', date:'26 Apr 2025, 14:32', items:3, total:355000, method:'QRIS', status:'Lunas', products:['T-Shirt Basic White M','Celana Chino Beige 30','Tote Bag Canvas'] },
  { id:'TRX-0247', date:'26 Apr 2025, 13:11', items:1, total:250000, method:'Cash', status:'Lunas', products:['Hoodie Oversize Grey L'] },
  { id:'TRX-0246', date:'26 Apr 2025, 11:55', items:2, total:215000, method:'Transfer', status:'Lunas', products:['Polo Basic Black M','Kaus Kaki Set 3pcs'] },
  { id:'TRX-0245', date:'26 Apr 2025, 10:22', items:4, total:490000, method:'QRIS', status:'Lunas', products:['Kemeja Linen Cream S','Celana Jogger Black M','Bucket Hat Beige','Tote Bag Canvas'] },
  { id:'TRX-0244', date:'25 Apr 2025, 17:40', items:1, total:350000, method:'Cash', status:'Lunas', products:['Jacket Bomber Olive M'] },
  { id:'TRX-0243', date:'25 Apr 2025, 16:08', items:2, total:130000, method:'QRIS', status:'Lunas', products:['T-Shirt Stripe Navy S','Kaus Kaki Set 3pcs'] },
  { id:'TRX-0242', date:'25 Apr 2025, 14:55', items:3, total:405000, method:'Transfer', status:'Lunas', products:['Kemeja Linen Cream M','Rok Mini Pleated S','Bucket Hat Beige'] },
  { id:'TRX-0241', date:'25 Apr 2025, 12:30', items:1, total:280000, method:'Cash', status:'Lunas', products:['Cardigan Knit Cream L'] },
  { id:'TRX-0240', date:'24 Apr 2025, 18:20', items:2, total:295000, method:'QRIS', status:'Lunas', products:['Crop Top Ribbed M','Celana Chino Beige 32'] },
  { id:'TRX-0239', date:'24 Apr 2025, 15:45', items:5, total:600000, method:'Transfer', status:'Lunas', products:['Hoodie Oversize Grey M','Celana Jogger Black L','T-Shirt Basic White L','Tote Bag Canvas','Kaus Kaki Set 3pcs'] },
  { id:'TRX-0238', date:'23 Apr 2025, 13:10', items:1, total:95000, method:'Cash', status:'Lunas', products:['Bucket Hat Beige'] },
  { id:'TRX-0237', date:'23 Apr 2025, 11:30', items:2, total:230000, method:'QRIS', status:'Lunas', products:['T-Shirt Stripe Navy M','Polo Basic Black S'] },
];

const WEEKLY = [
  { day:'Sen', rev:1820000 },
  { day:'Sel', rev:2350000 },
  { day:'Rab', rev:1650000 },
  { day:'Kam', rev:3100000 },
  { day:'Jum', rev:2700000 },
  { day:'Sab', rev:4200000 },
  { day:'Min', rev:1310000 },
];

const TOP_PRODUCTS = [
  { name:'Hoodie Oversize Grey', sold:34, rev:8500000 },
  { name:'Kemeja Linen Cream', sold:28, rev:5180000 },
  { name:'Jacket Bomber Olive', sold:21, rev:7350000 },
  { name:'Celana Chino Beige', sold:19, rev:3325000 },
  { name:'T-Shirt Basic White', sold:45, rev:3825000 },
];

function fmtRp(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

Object.assign(window, { PRODUCTS, TRANSACTIONS, WEEKLY, TOP_PRODUCTS, fmtRp });
