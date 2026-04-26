// ── SVG Icons ──────────────────────────────────────────
const Icon = ({ name, size=16, color='currentColor' }) => {
  const icons = {
    dashboard: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    pos: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    catalog: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    stock: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
    history: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    laporan: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    search: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    trash: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
    plus: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    up: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>,
    down: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>,
    print: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
    edit: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    filter: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    event: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    promo: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    users: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    settings: <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  };
  return icons[name] || null;
};

// ── Dashboard ──────────────────────────────────────────
const Dashboard = () => {
  const todayTrx = TRANSACTIONS.filter(t => t.date.startsWith('26 Apr'));
  const todayRev = todayTrx.reduce((s, t) => s + t.total, 0);
  const maxWeekly = Math.max(...WEEKLY.map(d => d.rev));
  const chartH = 80;

  return (
    <div className="content">
      {/* KPIs */}
      <div className="grid-4 mb-16">
        {[
          { label:'Pendapatan Hari Ini', value: fmtRp(todayRev), sub:'+12% dari kemarin', up:true, icon:'laporan', color:'#f5ead8' },
          { label:'Transaksi Hari Ini', value: todayTrx.length, sub:'+3 dari kemarin', up:true, icon:'pos', color:'#e8f0f8' },
          { label:'Item Terjual', value: todayTrx.reduce((s,t)=>s+t.items,0), sub:'dari 4 transaksi', up:true, icon:'catalog', color:'#ebf5ef' },
          { label:'Rata-rata Order', value: fmtRp(todayRev / (todayTrx.length||1)), sub:'-5% dari kemarin', up:false, icon:'history', color:'#fbeaea' },
        ].map((k,i) => (
          <div key={i} className="card">
            <div className="kpi-icon" style={{background:k.color}}>
              <Icon name={k.icon} size={18} color={k.up ? 'var(--accent)' : 'var(--text-2)'} />
            </div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-sub">
              <span className={k.up ? 'kpi-up' : 'kpi-down'}>{k.up ? '↑' : '↓'} {k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Weekly Chart */}
        <div className="card">
          <div className="row-between mb-16">
            <div className="section-title" style={{marginBottom:0}}>Pendapatan Minggu Ini</div>
            <span className="badge badge-amber">Apr 2025</span>
          </div>
          <svg width="100%" viewBox={`0 0 ${WEEKLY.length * 60} ${chartH + 28}`} style={{overflow:'visible'}}>
            {WEEKLY.map((d, i) => {
              const bh = (d.rev / maxWeekly) * chartH;
              const x = i * 60 + 16;
              const isToday = d.day === 'Min';
              return (
                <g key={i}>
                  <rect x={x} y={chartH - bh} width={28} height={bh} rx="4" fill={isToday ? 'var(--accent)' : 'var(--surface-2)'} />
                  <text x={x + 14} y={chartH + 18} textAnchor="middle" fontSize="11" fill="var(--text-2)" fontFamily="var(--font)" fontWeight="600">{d.day}</text>
                  <text x={x + 14} y={chartH - bh - 6} textAnchor="middle" fontSize="10" fill="var(--text-2)" fontFamily="var(--font)">{(d.rev/1000000).toFixed(1)}M</text>
                </g>
              );
            })}
          </svg>
          <div className="row-between" style={{marginTop:8}}>
            <span className="text-sm text-muted">Total minggu ini</span>
            <span className="font-bold" style={{fontSize:15}}>{fmtRp(WEEKLY.reduce((s,d)=>s+d.rev,0))}</span>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="row-between mb-16">
            <div className="section-title" style={{marginBottom:0}}>Produk Terlaris</div>
            <span className="text-sm text-muted">Bulan ini</span>
          </div>
          {TOP_PRODUCTS.map((p, i) => {
            const pct = (p.sold / TOP_PRODUCTS[0].sold) * 100;
            return (
              <div key={i} style={{marginBottom:14}}>
                <div className="row-between" style={{marginBottom:5}}>
                  <span style={{fontSize:13,fontWeight:600}}>{p.name}</span>
                  <span style={{fontSize:12.5,color:'var(--text-2)'}}>{p.sold} terjual</span>
                </div>
                <div style={{height:5,background:'var(--surface-2)',borderRadius:4}}>
                  <div style={{height:'100%',width:pct+'%',background:'var(--accent)',borderRadius:4,transition:'width 0.6s ease'}}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card" style={{marginTop:16}}>
        <div className="row-between mb-16">
          <div className="section-title" style={{marginBottom:0}}>Transaksi Terbaru</div>
          <span className="text-sm text-muted">Hari ini</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>ID</th><th>Waktu</th><th>Produk</th><th>Items</th><th>Total</th><th>Metode</th><th>Status</th>
            </tr></thead>
            <tbody>
              {TRANSACTIONS.slice(0,5).map(t => (
                <tr key={t.id}>
                  <td><span style={{fontWeight:700,fontSize:13}}>{t.id}</span></td>
                  <td className="text-muted text-sm">{t.date.split(', ')[1]}</td>
                  <td className="text-muted text-sm">{t.products.slice(0,2).join(', ')}{t.products.length>2 ? ` +${t.products.length-2}` : ''}</td>
                  <td>{t.items}</td>
                  <td><span style={{fontWeight:700}}>{fmtRp(t.total)}</span></td>
                  <td><span className="badge badge-gray">{t.method}</span></td>
                  <td><span className="badge badge-green">{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Kasir ──────────────────────────────────────────────
const Kasir = () => {
  const [search, setSearch] = React.useState('');
  const [cat, setCat] = React.useState('Semua');
  const [cart, setCart] = React.useState([]);
  const [modal, setModal] = React.useState(null);
  const [selSize, setSelSize] = React.useState('');
  const [payModal, setPayModal] = React.useState(false);
  const [paid, setPaid] = React.useState(false);
  const [cash, setCash] = React.useState('');

  const cats = ['Semua', 'Atasan', 'Bawahan', 'Outerwear', 'Aksesoris'];
  const filtered = PRODUCTS.filter(p =>
    (cat === 'Semua' || p.category === cat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = p => Object.values(p.sizes).reduce((a,b)=>a+b,0);
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const tax = Math.round(subtotal * 0.01);
  const total = subtotal + tax;

  const openProduct = p => { if(totalStock(p)===0) return; setModal(p); setSelSize(Object.keys(p.sizes)[0]); };

  const addToCart = () => {
    if(!selSize) return;
    setCart(prev => {
      const ex = prev.find(i=>i.id===modal.id&&i.size===selSize);
      if(ex) return prev.map(i=>i.id===modal.id&&i.size===selSize?{...i,qty:i.qty+1}:i);
      return [...prev, {id:modal.id,name:modal.name,size:selSize,price:modal.price,qty:1}];
    });
    setModal(null);
  };

  const changeQty = (id, size, delta) => {
    setCart(prev => prev.map(i=>i.id===id&&i.size===size?{...i,qty:Math.max(0,i.qty+delta)}:i).filter(i=>i.qty>0));
  };

  const handlePay = () => { setPaid(true); };
  const handleNewTrx = () => { setCart([]); setPayModal(false); setPaid(false); setCash(''); };

  const cashNum = parseInt(cash.replace(/\D/g,''))||0;
  const kembalian = cashNum - total;

  return (
    <div className="pos-layout" style={{height:'calc(100vh - 56px)'}}>
      {/* Catalog */}
      <div className="pos-catalog">
        <div style={{display:'flex',gap:10,marginBottom:14}}>
          <div className="input-wrap" style={{flex:1}}>
            <span className="input-icon"><Icon name="search" size={14}/></span>
            <input className="input has-icon" placeholder="Cari produk..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>
        <div className="cat-filter">
          {cats.map(c=><div key={c} className={`cat-chip${cat===c?' active':''}`} onClick={()=>setCat(c)}>{c}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}>
          {filtered.map(p => {
            const stock = totalStock(p);
            return (
              <div key={p.id} className={`product-card${stock===0?' out-of-stock':''}`} onClick={()=>openProduct(p)}>
                <div className="product-thumb">
                  <svg width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="4" fill="var(--border)"/><text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize="9" fill="var(--text-3)" fontFamily="monospace">{p.img}</text></svg>
                </div>
                <div className="product-name">{p.name}</div>
                <div className="product-price">{fmtRp(p.price)}</div>
                <div className="product-stock">{stock>0?`Stok: ${stock}`:'Habis'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div className="pos-cart">
        <div className="pos-cart-header">
          <div className="row-between">
            <span style={{fontWeight:800,fontSize:15}}>Keranjang</span>
            {cart.length>0&&<button className="btn btn-ghost btn-sm" style={{color:'var(--red)'}} onClick={()=>setCart([])}>Kosongkan</button>}
          </div>
          <div className="text-sm text-muted mt-4">{cart.reduce((s,i)=>s+i.qty,0)} item</div>
        </div>
        <div className="pos-cart-items">
          {cart.length===0 ? (
            <div className="empty-state" style={{padding:'40px 16px'}}>
              <Icon name="catalog" size={32} color="var(--text-3)" />
              <div style={{marginTop:10,fontSize:13}}>Pilih produk untuk ditambah</div>
            </div>
          ) : cart.map(item => (
            <div key={item.id+item.size} className="cart-item">
              <div style={{flex:1}}>
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-size">Size: {item.size}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                <div className="qty-ctrl">
                  <div className="qty-btn" onClick={()=>changeQty(item.id,item.size,-1)}>−</div>
                  <span className="qty-val">{item.qty}</span>
                  <div className="qty-btn" onClick={()=>changeQty(item.id,item.size,1)}>+</div>
                </div>
                <div className="cart-item-price">{fmtRp(item.price*item.qty)}</div>
              </div>
            </div>
          ))}
        </div>
        {cart.length>0 && (
          <div className="pos-cart-footer">
            <div style={{display:'flex',flexDirection:'column',gap:7,marginBottom:14}}>
              <div className="row-between text-sm"><span className="text-muted">Subtotal</span><span>{fmtRp(subtotal)}</span></div>
              <div className="row-between text-sm"><span className="text-muted">Pajak (1%)</span><span>{fmtRp(tax)}</span></div>
              <div className="divider" style={{margin:'4px 0'}}></div>
              <div className="row-between"><span style={{fontWeight:800,fontSize:15}}>Total</span><span style={{fontWeight:800,fontSize:17,color:'var(--accent)'}}>{fmtRp(total)}</span></div>
            </div>
            <button className="btn btn-primary w-full" style={{height:44,fontSize:14}} onClick={()=>setPayModal(true)}>
              Proses Pembayaran
            </button>
          </div>
        )}
      </div>

      {/* Product Size Modal */}
      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{modal.name}</div>
            <div style={{fontSize:20,fontWeight:800,color:'var(--accent)',marginBottom:16}}>{fmtRp(modal.price)}</div>
            <div style={{fontSize:13,fontWeight:700,color:'var(--text-2)',marginBottom:6}}>PILIH UKURAN</div>
            <div className="size-grid">
              {Object.entries(modal.sizes).map(([s,stock])=>(
                <div key={s} className={`size-chip${selSize===s?' selected':''}${stock===0?' unavail':''}`} onClick={()=>stock>0&&setSelSize(s)}>
                  {s}<br/><span style={{fontSize:10,fontWeight:400,opacity:0.7}}>{stock} stok</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8,marginTop:20}}>
              <button className="btn btn-secondary" style={{flex:1}} onClick={()=>setModal(null)}>Batal</button>
              <button className="btn btn-primary" style={{flex:2}} onClick={addToCart}>+ Tambah ke Keranjang</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && !paid && (
        <div className="modal-overlay">
          <div className="modal" style={{width:440}}>
            <div className="modal-title">Pembayaran</div>
            <div style={{fontSize:13,color:'var(--text-2)',marginBottom:4}}>Total yang harus dibayar</div>
            <div style={{fontSize:32,fontWeight:800,color:'var(--accent)',marginBottom:20}}>{fmtRp(total)}</div>
            <div style={{fontSize:13,fontWeight:700,color:'var(--text-2)',marginBottom:10}}>METODE PEMBAYARAN</div>
            {[
              {id:'qris',label:'QRIS',desc:'Scan QR Code'},
              {id:'cash',label:'Cash',desc:'Uang tunai'},
              {id:'transfer',label:'Transfer Bank',desc:'BCA / Mandiri / BNI'},
            ].map(m => (
              <div key={m.id} style={{padding:'12px 14px',border:'1.5px solid var(--border)',borderRadius:8,marginBottom:8,cursor:'pointer',background:'#fff'}} onClick={()=>{}}>
                <div style={{fontWeight:700,fontSize:13}}>{m.label}</div>
                <div style={{fontSize:12,color:'var(--text-2)'}}>{m.desc}</div>
              </div>
            ))}
            <div style={{marginTop:12}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--text-2)',marginBottom:6}}>JUMLAH UANG (CASH)</div>
              <input className="input" placeholder="0" value={cash} onChange={e=>setCash(e.target.value)} style={{fontWeight:700,fontSize:16}} />
              {cashNum>0&&<div style={{marginTop:8,fontSize:13,color:'var(--green)',fontWeight:600}}>Kembalian: {fmtRp(Math.max(0,kembalian))}</div>}
            </div>
            <div style={{display:'flex',gap:8,marginTop:20}}>
              <button className="btn btn-secondary" style={{flex:1}} onClick={()=>setPayModal(false)}>Batal</button>
              <button className="btn btn-primary" style={{flex:2,height:44}} onClick={handlePay}>Konfirmasi Bayar</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {paid && (
        <div className="modal-overlay">
          <div className="modal" style={{textAlign:'center'}}>
            <div style={{width:60,height:60,borderRadius:'50%',background:'var(--green-bg)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <Icon name="check" size={28} color="var(--green)"/>
            </div>
            <div style={{fontSize:20,fontWeight:800,marginBottom:8}}>Pembayaran Berhasil!</div>
            <div style={{fontSize:14,color:'var(--text-2)',marginBottom:4}}>Total dibayar</div>
            <div style={{fontSize:28,fontWeight:800,color:'var(--accent)',marginBottom:20}}>{fmtRp(total)}</div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-secondary" style={{flex:1}}><Icon name="print" size={14}/> Cetak Struk</button>
              <button className="btn btn-primary" style={{flex:1}} onClick={handleNewTrx}>Transaksi Baru</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Katalog ────────────────────────────────────────────
const Katalog = () => {
  const [search, setSearch] = React.useState('');
  const [cat, setCat] = React.useState('Semua');
  const cats = ['Semua','Atasan','Bawahan','Outerwear','Aksesoris'];
  const filtered = PRODUCTS.filter(p=>(cat==='Semua'||p.category===cat)&&p.name.toLowerCase().includes(search.toLowerCase()));
  const totalStock = p => Object.values(p.sizes).reduce((a,b)=>a+b,0);
  return (
    <div className="content">
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <div className="input-wrap" style={{flex:'1 1 200px'}}>
          <span className="input-icon"><Icon name="search" size={14}/></span>
          <input className="input has-icon" placeholder="Cari produk..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary"><Icon name="plus" size={14}/> Tambah Produk</button>
      </div>
      <div className="cat-filter">
        {cats.map(c=><div key={c} className={`cat-chip${cat===c?' active':''}`} onClick={()=>setCat(c)}>{c}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14,marginTop:4}}>
        {filtered.map(p=>{
          const stock = totalStock(p);
          return (
            <div key={p.id} className="card card-sm" style={{cursor:'pointer'}}>
              <div style={{width:'100%',aspectRatio:'4/3',borderRadius:8,background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12,fontSize:10,color:'var(--text-3)',fontFamily:'monospace'}}>
                {p.img}
              </div>
              <div style={{fontSize:13.5,fontWeight:700,marginBottom:3}}>{p.name}</div>
              <div style={{fontSize:12,color:'var(--text-2)',marginBottom:8}}>{p.sku} · {p.category}</div>
              <div className="row-between">
                <span style={{fontWeight:800,color:'var(--accent)',fontSize:14}}>{fmtRp(p.price)}</span>
                <span className={`badge ${stock>10?'badge-green':stock>0?'badge-amber':'badge-red'}`}>{stock>0?stock+' stok':'Habis'}</span>
              </div>
              <div style={{marginTop:10,display:'flex',gap:6}}>
                <button className="btn btn-secondary btn-sm" style={{flex:1}}><Icon name="edit" size={12}/> Edit</button>
                <button className="btn btn-ghost btn-sm btn-icon" style={{color:'var(--red)'}}><Icon name="trash" size={13}/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Stok ───────────────────────────────────────────────
const Stok = () => {
  const [search, setSearch] = React.useState('');
  const filtered = PRODUCTS.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));
  const totalStock = p => Object.values(p.sizes).reduce((a,b)=>a+b,0);
  return (
    <div className="content">
      <div style={{display:'flex',gap:10,marginBottom:16}}>
        <div className="input-wrap" style={{flex:1}}>
          <span className="input-icon"><Icon name="search" size={14}/></span>
          <input className="input has-icon" placeholder="Cari produk..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <button className="btn btn-secondary"><Icon name="filter" size={14}/> Filter</button>
        <button className="btn btn-primary"><Icon name="plus" size={14}/> Tambah Stok</button>
      </div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Produk</th><th>SKU</th><th>Kategori</th><th>Ukuran & Stok</th><th>Total Stok</th><th>Status</th><th>Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.map(p=>{
                const total = totalStock(p);
                const status = total===0?'Habis':total<=5?'Hampir Habis':total<=10?'Terbatas':'Tersedia';
                const badgeClass = total===0?'badge-red':total<=5?'badge-red':total<=10?'badge-amber':'badge-green';
                return (
                  <tr key={p.id}>
                    <td><span style={{fontWeight:700}}>{p.name}</span></td>
                    <td><span className="tag">{p.sku}</span></td>
                    <td className="text-muted">{p.category}</td>
                    <td>
                      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                        {Object.entries(p.sizes).map(([s,qty])=>(
                          <span key={s} style={{fontSize:11.5,padding:'2px 7px',borderRadius:4,background:qty===0?'var(--red-bg)':qty<=3?'var(--accent-bg)':'var(--surface)',color:qty===0?'var(--red)':qty<=3?'var(--accent)':'var(--text-2)',fontWeight:600}}>
                            {s}: {qty}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td><span style={{fontWeight:700}}>{total}</span></td>
                    <td><span className={`badge ${badgeClass}`}>{status}</span></td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn btn-secondary btn-sm"><Icon name="edit" size={12}/> Edit</button>
                        <button className="btn btn-primary btn-sm"><Icon name="plus" size={12}/> Tambah</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Riwayat ────────────────────────────────────────────
const Riwayat = () => {
  const [search, setSearch] = React.useState('');
  const [method, setMethod] = React.useState('Semua');
  const methods = ['Semua','Cash','QRIS','Transfer'];
  const filtered = TRANSACTIONS.filter(t=>
    (method==='Semua'||t.method===method) &&
    (t.id.toLowerCase().includes(search.toLowerCase()) || t.products.some(p=>p.toLowerCase().includes(search.toLowerCase())))
  );
  const totalRev = filtered.reduce((s,t)=>s+t.total,0);
  return (
    <div className="content">
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <div className="input-wrap" style={{flex:'1 1 200px'}}>
          <span className="input-icon"><Icon name="search" size={14}/></span>
          <input className="input has-icon" placeholder="Cari ID atau produk..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="cat-filter" style={{margin:0}}>
          {methods.map(m=><div key={m} className={`cat-chip${method===m?' active':''}`} onClick={()=>setMethod(m)}>{m}</div>)}
        </div>
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16}}>
        <div className="card card-sm" style={{flex:1}}>
          <div className="kpi-label">Total Transaksi</div>
          <div className="kpi-value" style={{fontSize:22}}>{filtered.length}</div>
        </div>
        <div className="card card-sm" style={{flex:1}}>
          <div className="kpi-label">Total Pendapatan</div>
          <div className="kpi-value" style={{fontSize:22}}>{fmtRp(totalRev)}</div>
        </div>
        <div className="card card-sm" style={{flex:1}}>
          <div className="kpi-label">Total Item</div>
          <div className="kpi-value" style={{fontSize:22}}>{filtered.reduce((s,t)=>s+t.items,0)}</div>
        </div>
      </div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>ID Transaksi</th><th>Tanggal & Waktu</th><th>Produk</th><th>Items</th><th>Total</th><th>Metode</th><th>Status</th>
            </tr></thead>
            <tbody>
              {filtered.map(t=>(
                <tr key={t.id}>
                  <td><span style={{fontWeight:700,color:'var(--accent)'}}>{t.id}</span></td>
                  <td className="text-sm text-muted">{t.date}</td>
                  <td className="text-sm text-muted" style={{maxWidth:240}}>{t.products.slice(0,2).join(', ')}{t.products.length>2?` +${t.products.length-2} lainnya`:''}</td>
                  <td><span style={{fontWeight:600}}>{t.items}</span></td>
                  <td><span style={{fontWeight:800}}>{fmtRp(t.total)}</span></td>
                  <td><span className="badge badge-gray">{t.method}</span></td>
                  <td><span className="badge badge-green">{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Laporan ────────────────────────────────────────────
const Laporan = () => {
  const maxRev = Math.max(...WEEKLY.map(d=>d.rev));
  const totalWeek = WEEKLY.reduce((s,d)=>s+d.rev,0);
  const methodBreakdown = [
    {label:'QRIS', pct:45, color:'var(--accent)'},
    {label:'Cash', pct:30, color:'var(--blue)'},
    {label:'Transfer', pct:25, color:'var(--green)'},
  ];
  return (
    <div className="content">
      <div className="grid-3 mb-16" style={{marginBottom:16}}>
        {[
          {label:'Pendapatan Bulan Ini', value:'Rp 47.250.000', sub:'↑ 18% dari bulan lalu'},
          {label:'Total Transaksi', value:'186', sub:'↑ 12% dari bulan lalu'},
          {label:'Produk Terjual', value:'412 item', sub:'↑ 9% dari bulan lalu'},
        ].map((k,i)=>(
          <div key={i} className="card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{fontSize:22}}>{k.value}</div>
            <div className="kpi-sub"><span className="kpi-up">{k.sub}</span></div>
          </div>
        ))}
      </div>
      <div className="grid-2" style={{marginBottom:16}}>
        {/* Weekly Revenue Chart */}
        <div className="card">
          <div className="section-title">Pendapatan Mingguan</div>
          <svg width="100%" viewBox={`0 0 ${WEEKLY.length*60} 110`} style={{overflow:'visible'}}>
            {WEEKLY.map((d,i)=>{
              const bh = (d.rev/maxRev)*80;
              const x = i*60+16;
              return (
                <g key={i}>
                  <rect x={x} y={80-bh} width={28} height={bh} rx="4" fill="var(--accent)" opacity="0.85"/>
                  <text x={x+14} y={98} textAnchor="middle" fontSize="11" fill="var(--text-2)" fontFamily="var(--font)" fontWeight="600">{d.day}</text>
                  <text x={x+14} y={80-bh-6} textAnchor="middle" fontSize="10" fill="var(--text-2)" fontFamily="var(--font)">{(d.rev/1000000).toFixed(1)}M</text>
                </g>
              );
            })}
          </svg>
          <div className="divider"></div>
          <div className="row-between text-sm">
            <span className="text-muted">Total minggu ini</span>
            <span className="font-bold">{fmtRp(totalWeek)}</span>
          </div>
        </div>
        {/* Payment Method */}
        <div className="card">
          <div className="section-title">Metode Pembayaran</div>
          {methodBreakdown.map((m,i)=>(
            <div key={i} style={{marginBottom:16}}>
              <div className="row-between" style={{marginBottom:6}}>
                <span style={{fontSize:13.5,fontWeight:600}}>{m.label}</span>
                <span style={{fontSize:13.5,fontWeight:800}}>{m.pct}%</span>
              </div>
              <div style={{height:8,background:'var(--surface-2)',borderRadius:8}}>
                <div style={{height:'100%',width:m.pct+'%',background:m.color,borderRadius:8}}></div>
              </div>
            </div>
          ))}
          <div className="divider"></div>
          <div className="text-sm text-muted">Berdasarkan 186 transaksi bulan ini</div>
        </div>
      </div>
      {/* Top Products Table */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
          <div className="section-title" style={{marginBottom:0}}>Produk Terlaris Bulan Ini</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Produk</th><th>Terjual</th><th>Pendapatan</th><th>% dari Total</th></tr></thead>
            <tbody>
              {TOP_PRODUCTS.map((p,i)=>{
                const totalRevAll = TOP_PRODUCTS.reduce((s,x)=>s+x.rev,0);
                const pct = ((p.rev/totalRevAll)*100).toFixed(1);
                return (
                  <tr key={i}>
                    <td><span style={{fontWeight:800,color:'var(--text-2)'}}>{i+1}</span></td>
                    <td><span style={{fontWeight:700}}>{p.name}</span></td>
                    <td>{p.sold} item</td>
                    <td><span style={{fontWeight:800}}>{fmtRp(p.rev)}</span></td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{flex:1,height:5,background:'var(--surface-2)',borderRadius:4}}>
                          <div style={{height:'100%',width:pct+'%',background:'var(--accent)',borderRadius:4}}></div>
                        </div>
                        <span style={{fontSize:12,fontWeight:600,minWidth:32}}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Icon, Dashboard, Kasir, Katalog, Stok, Riwayat, Laporan });
