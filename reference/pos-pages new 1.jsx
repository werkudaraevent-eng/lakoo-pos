// ── Event & Bazar Page ─────────────────────────────────
const EVENTS_DATA = [
  {
    id:'ev-001', name:'Bazar A — Grand Indonesia', location:'Grand Indonesia, Lt. 3 Booth 24',
    dateStart:'2025-04-26', dateEnd:'2025-04-28', status:'active',
    stockMode:'inherit', stockAlloc:{},
    revenue:4820000, transactions:18,
  },
  {
    id:'ev-002', name:'Bazar B — Central Park', location:'Central Park Mall — Weekend Market',
    dateStart:'2025-05-03', dateEnd:'2025-05-04', status:'upcoming',
    stockMode:'custom', stockAlloc:{ 'TSH-001':20, 'PLO-001':15, 'HOD-001':10 },
    revenue:0, transactions:0,
  },
  {
    id:'ev-003', name:'Bazar C — Pasar Santa', location:'Pasar Santa — Pop-up Event',
    dateStart:'2025-03-15', dateEnd:'2025-03-17', status:'ended',
    stockMode:'inherit', stockAlloc:{},
    revenue:11250000, transactions:42,
  },
];

const EventBazar = () => {
  const [events, setEvents] = React.useState(EVENTS_DATA);
  const [view, setView] = React.useState('list'); // 'list' | 'create' | 'detail'
  const [selected, setSelected] = React.useState(null);
  const [form, setForm] = React.useState({ name:'', location:'', dateStart:'', dateEnd:'', stockMode:'inherit' });
  const [stockTab, setStockTab] = React.useState('list');

  const statusMeta = { active:{label:'Aktif',cls:'badge-green'}, upcoming:{label:'Mendatang',cls:'badge-blue'}, ended:{label:'Selesai',cls:'badge-gray'} };

  const handleCreate = () => {
    if (!form.name || !form.dateStart) return;
    const ev = { ...form, id:'ev-'+Date.now(), status:'upcoming', stockAlloc:{}, revenue:0, transactions:0 };
    setEvents(prev=>[...prev, ev]);
    setForm({ name:'', location:'', dateStart:'', dateEnd:'', stockMode:'inherit' });
    setView('list');
  };

  if (view === 'create') return (
    <div className="content" style={{maxWidth:640}}>
      <div className="row" style={{marginBottom:24}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>setView('list')}>← Kembali</button>
        <div style={{fontSize:18,fontWeight:800}}>Buat Event Baru</div>
      </div>
      <div className="card" style={{display:'flex',flexDirection:'column',gap:16}}>
        <div>
          <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Nama Event / Bazar *</label>
          <input className="input" placeholder="mis: Bazar D — Summarecon" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Lokasi</label>
          <input className="input" placeholder="Nama mall, gedung, alamat..." value={form.location} onChange={e=>setForm({...form,location:e.target.value})} />
        </div>
        <div className="grid-2">
          <div>
            <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Tanggal Mulai *</label>
            <input className="input" type="date" value={form.dateStart} onChange={e=>setForm({...form,dateStart:e.target.value})} />
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Tanggal Selesai</label>
            <input className="input" type="date" value={form.dateEnd} onChange={e=>setForm({...form,dateEnd:e.target.value})} />
          </div>
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.5px'}}>Pengaturan Stok</label>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              { val:'inherit', title:'Ambil dari Toko Utama', desc:'Stok event menggunakan dan memotong stok toko utama secara langsung.' },
              { val:'custom', title:'Alokasi Stok Sendiri', desc:'Tentukan jumlah stok khusus yang dibawa ke event ini (tidak mempengaruhi toko utama sampai disesuaikan).' },
            ].map(opt => (
              <div key={opt.val} onClick={()=>setForm({...form,stockMode:opt.val})} style={{
                padding:'14px 16px', border:`1.5px solid ${form.stockMode===opt.val?'var(--accent)':'var(--border)'}`,
                borderRadius:10, cursor:'pointer', background: form.stockMode===opt.val ? 'var(--accent-light)' : '#fff',
                transition:'all 0.15s',
              }}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                  <div style={{width:16,height:16,borderRadius:'50%',border:`2px solid ${form.stockMode===opt.val?'var(--accent)':'var(--border)'}`,background:form.stockMode===opt.val?'var(--accent)':'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {form.stockMode===opt.val&&<div style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}></div>}
                  </div>
                  <span style={{fontWeight:700,fontSize:13.5}}>{opt.title}</span>
                </div>
                <div style={{fontSize:12.5,color:'var(--text-2)',paddingLeft:24}}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:4}}>
          <button className="btn btn-secondary" style={{flex:1}} onClick={()=>setView('list')}>Batal</button>
          <button className="btn btn-primary" style={{flex:2,height:44}} onClick={handleCreate}>Buat Event →</button>
        </div>
      </div>
    </div>
  );

  if (view === 'detail' && selected) {
    const ev = events.find(e=>e.id===selected);
    return (
      <div className="content">
        <div className="row" style={{marginBottom:20,flexWrap:'wrap',gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setView('list')}>← Kembali</button>
          <div style={{fontSize:18,fontWeight:800,flex:1}}>{ev.name}</div>
          <span className={`badge ${statusMeta[ev.status].cls}`}>{statusMeta[ev.status].label}</span>
          {ev.status==='upcoming'&&<button className="btn btn-primary btn-sm">Aktifkan</button>}
        </div>
        <div className="grid-3" style={{marginBottom:16}}>
          {[
            {label:'Pendapatan',value:fmtRp(ev.revenue)},
            {label:'Transaksi',value:ev.transactions},
            {label:'Mode Stok',value:ev.stockMode==='inherit'?'Dari Toko Utama':'Alokasi Sendiri'},
          ].map((k,i)=>(
            <div key={i} className="card"><div className="kpi-label">{k.label}</div><div className="kpi-value" style={{fontSize:20}}>{k.value}</div></div>
          ))}
        </div>
        {/* Tabs */}
        <div style={{display:'flex',gap:2,marginBottom:16,background:'var(--surface)',borderRadius:10,padding:4,width:'fit-content'}}>
          {['list','allocate'].map(t=>(
            <button key={t} onClick={()=>setStockTab(t)} className="btn" style={{
              padding:'6px 16px',fontSize:13,borderRadius:7,
              background:stockTab===t?'#fff':'transparent',
              boxShadow:stockTab===t?'0 1px 4px rgba(0,0,0,0.1)':'none',
              color:stockTab===t?'var(--text)':'var(--text-2)',fontWeight:600,border:'none',
            }}>
              {t==='list'?'Produk & Stok':'Alokasi Stok'}
            </button>
          ))}
        </div>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13.5}}>
            <thead><tr>
              <th style={{textAlign:'left',padding:'10px 14px',fontSize:11.5,fontWeight:700,color:'var(--text-2)',borderBottom:'1px solid var(--border)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Produk</th>
              <th style={{textAlign:'left',padding:'10px 14px',fontSize:11.5,fontWeight:700,color:'var(--text-2)',borderBottom:'1px solid var(--border)',textTransform:'uppercase',letterSpacing:'0.5px'}}>SKU</th>
              <th style={{textAlign:'left',padding:'10px 14px',fontSize:11.5,fontWeight:700,color:'var(--text-2)',borderBottom:'1px solid var(--border)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Stok Toko</th>
              <th style={{textAlign:'left',padding:'10px 14px',fontSize:11.5,fontWeight:700,color:'var(--text-2)',borderBottom:'1px solid var(--border)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Alokasi Event</th>
              <th style={{textAlign:'left',padding:'10px 14px',fontSize:11.5,fontWeight:700,color:'var(--text-2)',borderBottom:'1px solid var(--border)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Sisa Toko</th>
            </tr></thead>
            <tbody>
              {PRODUCTS.slice(0,8).map(p=>{
                const tokoStock = Object.values(p.sizes).reduce((a,b)=>a+b,0);
                const alloc = ev.stockAlloc[p.sku] || 0;
                return (
                  <tr key={p.id} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:'12px 14px',fontWeight:600}}>{p.name}</td>
                    <td style={{padding:'12px 14px'}}><span className="tag">{p.sku}</span></td>
                    <td style={{padding:'12px 14px'}}>{tokoStock}</td>
                    <td style={{padding:'12px 14px'}}>
                      {ev.stockMode==='custom'
                        ? <input type="number" style={{width:70,padding:'4px 8px',border:'1px solid var(--border)',borderRadius:6,fontSize:13,fontFamily:'var(--font)'}} defaultValue={alloc} min={0} max={tokoStock} />
                        : <span className="text-muted text-sm">Mengikuti toko</span>
                      }
                    </td>
                    <td style={{padding:'12px 14px'}}>
                      <span style={{fontWeight:600,color:ev.stockMode==='custom'&&(tokoStock-alloc)<=3?'var(--red)':'var(--text)'}}>{ev.stockMode==='custom'?tokoStock-alloc:tokoStock}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {ev.stockMode==='custom'&&<div style={{marginTop:12,display:'flex',justifyContent:'flex-end'}}>
          <button className="btn btn-primary">Simpan Alokasi Stok</button>
        </div>}
      </div>
    );
  }

  return (
    <div className="content">
      <div className="row-between mb-16">
        <div>
          <div style={{fontSize:13,color:'var(--text-2)'}}>{events.length} event terdaftar</div>
        </div>
        <button className="btn btn-primary" onClick={()=>setView('create')}><Icon name="plus" size={14}/> Buat Event Baru</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {events.map(ev=>(
          <div key={ev.id} className="card" style={{display:'flex',alignItems:'center',gap:20,padding:'18px 20px',cursor:'pointer',transition:'box-shadow 0.15s'}}
            onClick={()=>{setSelected(ev.id);setView('detail');}}>
            <div style={{width:48,height:48,borderRadius:12,background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="22" height="22" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                <span style={{fontWeight:800,fontSize:15}}>{ev.name}</span>
                <span className={`badge ${statusMeta[ev.status].cls}`}>{statusMeta[ev.status].label}</span>
              </div>
              <div style={{fontSize:13,color:'var(--text-2)'}}>{ev.location} · {ev.dateStart}{ev.dateEnd&&` – ${ev.dateEnd}`}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontWeight:800,fontSize:15}}>{fmtRp(ev.revenue)}</div>
              <div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{ev.transactions} transaksi</div>
            </div>
            <div style={{color:'var(--text-3)',marginLeft:4}}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Promosi Page ───────────────────────────────────────
const PROMOS_DATA = [
  { id:'promo-001', name:'Flash Sale Akhir April', type:'persen', value:20, scope:'all', dateStart:'2025-04-25', dateEnd:'2025-04-30', status:'active', used:34 },
  { id:'promo-002', name:'Diskon Kategori Atasan', type:'persen', value:15, scope:'category', scopeVal:'Atasan', dateStart:'2025-05-01', dateEnd:'2025-05-07', status:'upcoming', used:0 },
  { id:'promo-003', name:'Gratis Kaos Kaki', type:'bogo', value:0, scope:'product', scopeVal:'SOK-001', dateStart:'2025-04-01', dateEnd:'2025-04-20', status:'ended', used:89 },
  { id:'promo-004', name:'Hemat Rp 25.000', type:'nominal', value:25000, scope:'minPurchase', scopeVal:'150000', dateStart:'2025-05-10', dateEnd:'2025-05-31', status:'upcoming', used:0 },
];

const Promosi = () => {
  const [promos, setPromos] = React.useState(PROMOS_DATA);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editPromo, setEditPromo] = React.useState(null);
  const [filter, setFilter] = React.useState('Semua');
  const emptyForm = { name:'', type:'persen', value:'', scope:'all', scopeVal:'', dateStart:'', dateEnd:'' };
  const [form, setForm] = React.useState(emptyForm);

  const statusMeta = { active:{label:'Aktif',cls:'badge-green'}, upcoming:{label:'Mendatang',cls:'badge-blue'}, ended:{label:'Selesai',cls:'badge-gray'} };
  const typeMeta = { persen:'Diskon %', nominal:'Diskon Rp', bogo:'Gratis Produk' };

  const filters = ['Semua','Aktif','Mendatang','Selesai'];
  const filtered = promos.filter(p=>filter==='Semua'||statusMeta[p.status].label===filter);

  const openEdit = p => { setEditPromo(p); setForm({ name:p.name, type:p.type, value:p.value, scope:p.scope, scopeVal:p.scopeVal||'', dateStart:p.dateStart, dateEnd:p.dateEnd||'' }); setShowCreate(true); };
  const openCreate = () => { setEditPromo(null); setForm(emptyForm); setShowCreate(true); };

  const handleSave = () => {
    if(!form.name||!form.dateStart) return;
    if(editPromo) {
      setPromos(prev=>prev.map(p=>p.id===editPromo.id?{...p,...form,value:Number(form.value)||0}:p));
    } else {
      setPromos(prev=>[...prev,{...form,id:'promo-'+Date.now(),status:'upcoming',used:0,value:Number(form.value)||0}]);
    }
    setShowCreate(false);
  };

  const handleDelete = id => { setPromos(prev=>prev.filter(p=>p.id!==id)); setShowCreate(false); };

  return (
    <div className="content">
      <div className="row-between mb-16">
        <div className="cat-filter" style={{margin:0}}>
          {filters.map(f=><div key={f} className={`cat-chip${filter===f?' active':''}`} onClick={()=>setFilter(f)}>{f}</div>)}
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Icon name="plus" size={14}/> Buat Promo</button>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {filtered.map(p=>(
          <div key={p.id} className="card" style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px'}}>
            <div style={{width:44,height:44,borderRadius:10,background:p.status==='active'?'var(--accent-bg)':p.status==='upcoming'?'var(--blue-bg)':'var(--surface)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="20" height="20" fill="none" stroke={p.status==='active'?'var(--accent)':p.status==='upcoming'?'var(--blue)':'var(--text-2)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                <span style={{fontWeight:800,fontSize:14}}>{p.name}</span>
                <span className={`badge ${statusMeta[p.status].cls}`}>{statusMeta[p.status].label}</span>
                <span className="badge badge-gray">{typeMeta[p.type]}</span>
              </div>
              <div style={{fontSize:12.5,color:'var(--text-2)'}}>
                {p.type==='persen'?`Diskon ${p.value}%`:p.type==='nominal'?`Hemat ${fmtRp(p.value)}`:p.type==='bogo'?'Beli 1 Gratis 1':''}
                {p.scope==='category'?` · Kategori: ${p.scopeVal}`:p.scope==='minPurchase'?` · Min. belanja ${fmtRp(Number(p.scopeVal)||0)}`:''}
                {` · ${p.dateStart} – ${p.dateEnd||'dst'}`}
              </div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontWeight:800,fontSize:15}}>{p.used}×</div>
              <div style={{fontSize:12,color:'var(--text-2)'}}>digunakan</div>
            </div>
            <div style={{display:'flex',gap:6,marginLeft:8}}>
              <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(p)}><Icon name="edit" size={12}/> Edit</button>
              {p.status!=='ended'&&<button className="btn btn-ghost btn-sm" style={{color:'var(--red)'}} onClick={()=>handleDelete(p.id)}><Icon name="trash" size={13}/></button>}
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showCreate&&(
        <div className="modal-overlay" onClick={()=>setShowCreate(false)}>
          <div className="modal" style={{width:480}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div className="modal-title" style={{marginBottom:0}}>{editPromo?'Edit Promo':'Buat Promo Baru'}</div>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowCreate(false)}><Icon name="x" size={15}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Nama Promo *</label>
                <input className="input" placeholder="mis: Flash Sale Mei" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
              </div>
              <div className="grid-2">
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Jenis Diskon</label>
                  <select className="select" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                    <option value="persen">Diskon %</option>
                    <option value="nominal">Diskon Rp</option>
                    <option value="bogo">Gratis Produk</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Nilai</label>
                  <input className="input" type="number" placeholder={form.type==='persen'?'20':'25000'} value={form.value} onChange={e=>setForm({...form,value:e.target.value})} />
                </div>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Berlaku Untuk</label>
                <select className="select" value={form.scope} onChange={e=>setForm({...form,scope:e.target.value})}>
                  <option value="all">Semua Produk</option>
                  <option value="category">Kategori Tertentu</option>
                  <option value="product">Produk Tertentu (SKU)</option>
                  <option value="minPurchase">Min. Pembelian</option>
                </select>
              </div>
              {(form.scope==='category'||form.scope==='product'||form.scope==='minPurchase')&&(
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>
                    {form.scope==='category'?'Nama Kategori':form.scope==='product'?'SKU Produk':'Minimum Pembelian (Rp)'}
                  </label>
                  <input className="input" placeholder={form.scope==='category'?'Atasan':form.scope==='product'?'TSH-001':'150000'} value={form.scopeVal} onChange={e=>setForm({...form,scopeVal:e.target.value})} />
                </div>
              )}
              <div className="grid-2">
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Tanggal Mulai *</label>
                  <input className="input" type="date" value={form.dateStart} onChange={e=>setForm({...form,dateStart:e.target.value})} />
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Tanggal Selesai</label>
                  <input className="input" type="date" value={form.dateEnd} onChange={e=>setForm({...form,dateEnd:e.target.value})} />
                </div>
              </div>
              <div style={{display:'flex',gap:8,marginTop:4}}>
                {editPromo&&<button className="btn btn-ghost btn-sm" style={{color:'var(--red)'}} onClick={()=>handleDelete(editPromo.id)}><Icon name="trash" size={13}/> Hapus</button>}
                <div style={{flex:1}}></div>
                <button className="btn btn-secondary" onClick={()=>setShowCreate(false)}>Batal</button>
                <button className="btn btn-primary" onClick={handleSave}>{editPromo?'Simpan Perubahan':'Buat Promo'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Pengaturan Page ────────────────────────────────────
const Pengaturan = () => {
  const [tab, setTab] = React.useState('toko');
  const [toko, setToko] = React.useState({ name:'Nyam Store', tagline:'Clothing & Lifestyle', address:'Jl. Kemang Raya No.12, Jakarta Selatan', phone:'021-7812345', email:'hello@nyamstore.id', instagram:'@nyamstore' });
  const [receipt, setReceipt] = React.useState({ header:'Terima kasih telah berbelanja di Nyam!', footer:'IG: @nyamstore | nyamstore.id', showLogo:true, showBarcode:true });
  const [payment, setPayment] = React.useState({ cash:true, qris:true, transfer:true, debit:false, kredit:false });
  const [tax, setTax] = React.useState({ enabled:true, rate:1, name:'Pajak Layanan' });
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => { setSaved(true); setTimeout(()=>setSaved(false), 2000); };

  const tabs = [
    { id:'toko', label:'Info Toko' },
    { id:'struk', label:'Struk & Print' },
    { id:'pembayaran', label:'Metode Bayar' },
    { id:'pajak', label:'Pajak' },
  ];

  return (
    <div className="content" style={{maxWidth:720}}>
      {/* Tabs */}
      <div style={{display:'flex',gap:2,marginBottom:24,background:'var(--surface)',borderRadius:10,padding:4,width:'fit-content'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className="btn" style={{
            padding:'7px 18px',fontSize:13,borderRadius:7,
            background:tab===t.id?'#fff':'transparent',
            boxShadow:tab===t.id?'0 1px 4px rgba(0,0,0,0.1)':'none',
            color:tab===t.id?'var(--text)':'var(--text-2)',fontWeight:600,border:'none',
          }}>{t.label}</button>
        ))}
      </div>

      {tab==='toko'&&(
        <div className="card" style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>Informasi Toko</div>
          {[
            {key:'name',label:'Nama Toko'},
            {key:'tagline',label:'Tagline'},
            {key:'address',label:'Alamat'},
            {key:'phone',label:'Nomor Telepon'},
            {key:'email',label:'Email'},
            {key:'instagram',label:'Instagram'},
          ].map(f=>(
            <div key={f.key}>
              <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>{f.label}</label>
              <input className="input" value={toko[f.key]} onChange={e=>setToko({...toko,[f.key]:e.target.value})} />
            </div>
          ))}
        </div>
      )}

      {tab==='struk'&&(
        <div className="card" style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>Pengaturan Struk</div>
          {[
            {key:'header',label:'Teks Header Struk'},
            {key:'footer',label:'Teks Footer Struk'},
          ].map(f=>(
            <div key={f.key}>
              <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>{f.label}</label>
              <input className="input" value={receipt[f.key]} onChange={e=>setReceipt({...receipt,[f.key]:e.target.value})} />
            </div>
          ))}
          {[
            {key:'showLogo',label:'Tampilkan Logo di Struk'},
            {key:'showBarcode',label:'Tampilkan Barcode Transaksi'},
          ].map(f=>(
            <div key={f.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderTop:'1px solid var(--border)'}}>
              <span style={{fontSize:14,fontWeight:600}}>{f.label}</span>
              <div onClick={()=>setReceipt({...receipt,[f.key]:!receipt[f.key]})} style={{
                width:44,height:24,borderRadius:12,background:receipt[f.key]?'var(--accent)':'var(--surface-2)',
                cursor:'pointer',position:'relative',transition:'background 0.2s',
              }}>
                <div style={{position:'absolute',top:3,left:receipt[f.key]?22:3,width:18,height:18,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,0.2)',transition:'left 0.2s'}}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='pembayaran'&&(
        <div className="card" style={{display:'flex',flexDirection:'column',gap:0}}>
          <div style={{fontSize:15,fontWeight:800,marginBottom:16}}>Metode Pembayaran</div>
          {[
            {key:'cash',label:'Cash / Uang Tunai',desc:'Pembayaran dengan uang tunai'},
            {key:'qris',label:'QRIS',desc:'Scan QR Code (GoPay, OVO, Dana, dll)'},
            {key:'transfer',label:'Transfer Bank',desc:'BCA, Mandiri, BNI, BRI'},
            {key:'debit',label:'Kartu Debit',desc:'Mesin EDC diperlukan'},
            {key:'kredit',label:'Kartu Kredit',desc:'Mesin EDC + surcharge berlaku'},
          ].map((m,i)=>(
            <div key={m.key} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0',borderTop: i>0?'1px solid var(--border)':'none'}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14}}>{m.label}</div>
                <div style={{fontSize:12.5,color:'var(--text-2)',marginTop:2}}>{m.desc}</div>
              </div>
              <div onClick={()=>setPayment({...payment,[m.key]:!payment[m.key]})} style={{
                width:44,height:24,borderRadius:12,background:payment[m.key]?'var(--accent)':'var(--surface-2)',
                cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0,
              }}>
                <div style={{position:'absolute',top:3,left:payment[m.key]?22:3,width:18,height:18,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,0.2)',transition:'left 0.2s'}}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='pajak'&&(
        <div className="card" style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:15,fontWeight:800}}>Pajak & Biaya Layanan</div>
            <div onClick={()=>setTax({...tax,enabled:!tax.enabled})} style={{
              width:44,height:24,borderRadius:12,background:tax.enabled?'var(--accent)':'var(--surface-2)',
              cursor:'pointer',position:'relative',transition:'background 0.2s',
            }}>
              <div style={{position:'absolute',top:3,left:tax.enabled?22:3,width:18,height:18,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,0.2)',transition:'left 0.2s'}}></div>
            </div>
          </div>
          {tax.enabled&&<>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Nama Pajak</label>
              <input className="input" value={tax.name} onChange={e=>setTax({...tax,name:e.target.value})} />
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Persentase (%)</label>
              <input className="input" type="number" min={0} max={100} value={tax.rate} onChange={e=>setTax({...tax,rate:Number(e.target.value)})} style={{maxWidth:120}} />
            </div>
            <div style={{background:'var(--surface)',borderRadius:8,padding:'12px 14px',fontSize:13,color:'var(--text-2)'}}>
              Contoh: Pembelian Rp 100.000 akan dikenakan pajak <strong>{tax.name}</strong> sebesar <strong>{tax.rate}%</strong> = <strong>Rp {(100000*tax.rate/100).toLocaleString('id-ID')}</strong>
            </div>
          </>}
        </div>
      )}

      <div style={{marginTop:16,display:'flex',justifyContent:'flex-end'}}>
        <button className="btn btn-primary" style={{minWidth:140,height:42}} onClick={handleSave}>
          {saved ? <><Icon name="check" size={14}/> Tersimpan!</> : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );
};

// ── Pengguna Page ──────────────────────────────────────
const USERS_DATA = [
  { id:'usr-001', name:'Admin', username:'admin', role:'Admin Utama', status:'active', avatar:'A', lastLogin:'26 Apr 2025, 09:12', sessions:['Toko Harian','Bazar A'] },
  { id:'usr-002', name:'Rina Aulia', username:'kasir1', role:'Kasir', status:'active', avatar:'R', lastLogin:'26 Apr 2025, 10:05', sessions:['Toko Harian'] },
  { id:'usr-003', name:'Dimas Prasetyo', username:'kasir2', role:'Kasir', status:'active', avatar:'D', lastLogin:'25 Apr 2025, 17:30', sessions:['Bazar A','Bazar B'] },
  { id:'usr-004', name:'Sinta Rahayu', username:'kasir3', role:'Kasir', status:'inactive', avatar:'S', lastLogin:'20 Apr 2025, 14:00', sessions:[] },
];

const ROLE_PERMS = {
  'Admin Utama': ['Dashboard','Kasir','Katalog','Stok','Riwayat','Laporan','Event & Bazar','Promosi','Pengaturan','Pengguna'],
  'Kasir': ['Kasir','Riwayat'],
  'Supervisor': ['Dashboard','Kasir','Katalog','Stok','Riwayat','Laporan'],
};

const Pengguna = () => {
  const [users, setUsers] = React.useState(USERS_DATA);
  const [modalMode, setModalMode] = React.useState(null); // null | 'create' | 'edit'
  const [editUser, setEditUser] = React.useState(null);
  const emptyForm = { name:'', username:'', role:'Kasir', password:'' };
  const [form, setForm] = React.useState(emptyForm);

  const openCreate = () => { setEditUser(null); setForm(emptyForm); setModalMode('create'); };
  const openEdit = u => { setEditUser(u); setForm({ name:u.name, username:u.username, role:u.role, password:'' }); setModalMode('edit'); };
  const closeModal = () => { setModalMode(null); setEditUser(null); };

  const handleSave = () => {
    if(!form.name||!form.username) return;
    if(modalMode==='edit') {
      setUsers(prev=>prev.map(u=>u.id===editUser.id?{...u,name:form.name,username:form.username,role:form.role,avatar:form.name[0].toUpperCase()}:u));
    } else {
      setUsers(prev=>[...prev,{...form,id:'usr-'+Date.now(),status:'active',avatar:form.name[0].toUpperCase(),lastLogin:'Belum login',sessions:[]}]);
    }
    closeModal();
  };

  const toggleStatus = id => setUsers(prev=>prev.map(u=>u.id===id?{...u,status:u.status==='active'?'inactive':'active'}:u));
  const deleteUser = id => { setUsers(prev=>prev.filter(u=>u.id!==id)); closeModal(); };

  return (
    <div className="content">
      <div className="row-between mb-16">
        <div style={{fontSize:13,color:'var(--text-2)'}}>{users.filter(u=>u.status==='active').length} pengguna aktif</div>
        <button className="btn btn-primary" onClick={openCreate}><Icon name="plus" size={14}/> Tambah Pengguna</button>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
        {users.map(u=>(
          <div key={u.id} className="card" style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px'}}>
            <div style={{width:44,height:44,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,color:'#fff',flexShrink:0,opacity:u.status==='inactive'?0.4:1}}>
              {u.avatar}
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                <span style={{fontWeight:800,fontSize:14}}>{u.name}</span>
                <span className="badge badge-gray">{u.role}</span>
                <span className={`badge ${u.status==='active'?'badge-green':'badge-red'}`}>{u.status==='active'?'Aktif':'Nonaktif'}</span>
              </div>
              <div style={{fontSize:12.5,color:'var(--text-2)'}}>@{u.username} · Login terakhir: {u.lastLogin}</div>
            </div>
            <div style={{fontSize:12.5,color:'var(--text-2)',maxWidth:180,textAlign:'right'}}>
              {u.sessions.length>0?u.sessions.join(', '):<span style={{fontStyle:'italic'}}>Belum ada sesi</span>}
            </div>
            <div style={{display:'flex',gap:6,marginLeft:8}}>
              <button className="btn btn-secondary btn-sm" onClick={()=>openEdit(u)}><Icon name="edit" size={12}/> Edit</button>
              {u.role!=='Admin Utama'&&(
                <button className="btn btn-ghost btn-sm" style={{color:u.status==='active'?'var(--red)':'var(--green)'}} onClick={()=>toggleStatus(u.id)}>
                  {u.status==='active'?'Nonaktifkan':'Aktifkan'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Role permissions table */}
      <div className="card">
        <div style={{fontSize:14,fontWeight:800,marginBottom:16}}>Hak Akses per Role</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr>
                <th style={{textAlign:'left',padding:'8px 12px',fontWeight:700,color:'var(--text-2)',fontSize:11.5,textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid var(--border)'}}>Fitur</th>
                {Object.keys(ROLE_PERMS).map(r=>(
                  <th key={r} style={{textAlign:'center',padding:'8px 12px',fontWeight:700,color:'var(--text-2)',fontSize:11.5,textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid var(--border)'}}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['Dashboard','Kasir','Katalog','Stok','Riwayat','Laporan','Event & Bazar','Promosi','Pengaturan','Pengguna'].map((feat)=>(
                <tr key={feat} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={{padding:'10px 12px',fontWeight:600}}>{feat}</td>
                  {Object.entries(ROLE_PERMS).map(([role,perms])=>(
                    <td key={role} style={{padding:'10px 12px',textAlign:'center'}}>
                      {perms.includes(feat)?<span style={{color:'var(--green)',fontSize:16}}>✓</span>:<span style={{color:'var(--text-3)',fontSize:14}}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalMode&&(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{width:440}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div className="modal-title" style={{marginBottom:0}}>{modalMode==='edit'?`Edit: ${editUser?.name}`:'Tambah Pengguna'}</div>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}><Icon name="x" size={15}/></button>
            </div>
            {modalMode==='edit'&&(
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'var(--surface)',borderRadius:10,marginBottom:20}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,color:'#fff',flexShrink:0}}>{editUser?.avatar}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:13.5}}>{editUser?.name}</div>
                  <div style={{fontSize:12,color:'var(--text-2)'}}>Login terakhir: {editUser?.lastLogin}</div>
                </div>
                <span className={`badge ${editUser?.status==='active'?'badge-green':'badge-red'}`} style={{marginLeft:'auto'}}>{editUser?.status==='active'?'Aktif':'Nonaktif'}</span>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Nama Lengkap *</label>
                <input className="input" placeholder="Nama kasir" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Username *</label>
                <input className="input" placeholder="username login" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} />
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>{modalMode==='edit'?'Password Baru (kosongkan jika tidak diubah)':'Password'}</label>
                <input className="input" type="password" placeholder="Minimal 6 karakter" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Role</label>
                <select className="select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                  <option value="Kasir">Kasir</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Admin Utama">Admin Utama</option>
                </select>
              </div>
              <div style={{background:'var(--surface)',borderRadius:8,padding:'10px 14px',fontSize:12.5,color:'var(--text-2)'}}>
                <strong>Akses {form.role}:</strong> {ROLE_PERMS[form.role]?.join(', ')}
              </div>
              <div style={{display:'flex',gap:8,marginTop:4}}>
                {modalMode==='edit'&&editUser?.role!=='Admin Utama'&&(
                  <button className="btn btn-ghost btn-sm" style={{color:'var(--red)'}} onClick={()=>deleteUser(editUser.id)}>
                    <Icon name="trash" size={13}/> Hapus
                  </button>
                )}
                <div style={{flex:1}}></div>
                <button className="btn btn-secondary" onClick={closeModal}>Batal</button>
                <button className="btn btn-primary" onClick={handleSave}>{modalMode==='edit'?'Simpan Perubahan':'Tambah Pengguna'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { EventBazar, Promosi, Pengaturan, Pengguna });
