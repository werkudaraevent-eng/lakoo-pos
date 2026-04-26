// ── Icons (shared, already in window from pos-pages) ──────────────

// ── Login Page ────────────────────────────────────────────────────
const USERS = [
  { username:'admin', password:'admin123', name:'Admin', role:'Kasir Utama', avatar:'A' },
  { username:'kasir1', password:'kasir1', name:'Rina Aulia', role:'Kasir', avatar:'R' },
  { username:'kasir2', password:'kasir2', name:'Dimas Prasetyo', role:'Kasir', avatar:'D' },
];

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password);
      if (user) { onLogin(user); }
      else { setError('Username atau password salah.'); setLoading(false); }
    }, 600);
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      {/* Background pattern */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',overflow:'hidden',zIndex:0}}>
        <svg width="100%" height="100%" style={{opacity:0.04}}>
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="1.5" fill="var(--text)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div style={{position:'relative',zIndex:1,width:'100%',maxWidth:420}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:48,fontWeight:800,color:'var(--text)',letterSpacing:'-2px',lineHeight:1}}>nyam.</div>
          <div style={{fontSize:13,color:'var(--text-2)',marginTop:6,fontWeight:500,letterSpacing:'0.5px',textTransform:'uppercase'}}>Point of Sale System</div>
        </div>

        {/* Card */}
        <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:16,padding:32,boxShadow:'0 4px 32px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>Selamat datang</div>
          <div style={{fontSize:13.5,color:'var(--text-2)',marginBottom:24}}>Masuk ke akun kasir Anda</div>

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12.5,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Username</label>
              <input
                className="input"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={e=>{setUsername(e.target.value);setError('');}}
                autoComplete="username"
                style={{fontSize:14}}
              />
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:12.5,fontWeight:700,color:'var(--text-2)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>Password</label>
              <div style={{position:'relative'}}>
                <input
                  className="input"
                  type={showPass?'text':'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={e=>{setPassword(e.target.value);setError('');}}
                  autoComplete="current-password"
                  style={{fontSize:14,paddingRight:40}}
                />
                <button type="button" onClick={()=>setShowPass(!showPass)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-2)',fontSize:12,fontWeight:600,fontFamily:'var(--font)'}}>
                  {showPass?'Sembunyikan':'Tampilkan'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{background:'var(--red-bg)',border:'1px solid #f5c6c6',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'var(--red)',fontWeight:600}}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" style={{height:46,fontSize:14,fontWeight:700}} disabled={loading}>
              {loading ? 'Memverifikasi...' : 'Masuk →'}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        <div style={{textAlign:'center',marginTop:16,fontSize:12,color:'var(--text-3)'}}>
          Demo: <span style={{fontFamily:'monospace',background:'var(--surface)',padding:'1px 6px',borderRadius:4}}>admin</span> / <span style={{fontFamily:'monospace',background:'var(--surface)',padding:'1px 6px',borderRadius:4}}>admin123</span>
        </div>
      </div>
    </div>
  );
};

// ── Session Page ──────────────────────────────────────────────────
const SESSIONS_DATA = [
  { id:'toko', type:'toko', label:'Toko Harian', location:'Jl. Kemang Raya No.12, Jakarta Selatan', icon:'store', color:'var(--accent-bg)', accent:'var(--accent)' },
  { id:'bazar-a', type:'bazar', label:'Bazar A', location:'Grand Indonesia, Lt. 3 — Booth 24', icon:'bazarA', color:'#e8f0f8', accent:'var(--blue)' },
  { id:'bazar-b', type:'bazar', label:'Bazar B', location:'Central Park Mall — Weekend Market', icon:'bazarB', color:'#ebf5ef', accent:'var(--green)' },
  { id:'bazar-c', type:'bazar', label:'Bazar C', location:'Pasar Santa — Pop-up Event', icon:'bazarC', color:'#f3eaf8', accent:'#8b5cf6' },
];

const SessionIcon = ({ type, color, size=32 }) => {
  if (type === 'toko') return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
  return (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M4 3h16l-2 7H6L4 3z"/><path d="M6 10v10a1 1 0 001 1h10a1 1 0 001-1V10"/><path d="M9 21v-5a1 1 0 011-1h4a1 1 0 011 1v5"/>
    </svg>
  );
};

const SessionPage = ({ user, onSelectSession, onLogout }) => {
  const [sessions, setSessions] = React.useState(SESSIONS_DATA);
  const [hovered, setHovered] = React.useState(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newLoc, setNewLoc] = React.useState('');

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const handleAdd = () => {
    if (!newName.trim()) return;
    const id = 'bazar-' + Date.now();
    setSessions(prev => [...prev, {
      id, type:'bazar', label: newName.trim(),
      location: newLoc.trim() || 'Lokasi belum ditentukan',
      color:'#fdf4e8', accent:'var(--accent)'
    }]);
    setNewName(''); setNewLoc(''); setShowAdd(false);
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column'}}>
      {/* Top bar */}
      <div style={{background:'#fff',borderBottom:'1px solid var(--border)',padding:'0 32px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:22,fontWeight:800,letterSpacing:'-0.5px'}}>nyam.</div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:13.5,fontWeight:700}}>{user.name}</div>
            <div style={{fontSize:12,color:'var(--text-2)'}}>{user.role}</div>
          </div>
          <div style={{width:36,height:36,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#fff'}}>{user.avatar}</div>
          <button className="btn btn-ghost btn-sm" onClick={onLogout} style={{color:'var(--text-2)',marginLeft:4}}>Keluar</button>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
        <div style={{width:'100%',maxWidth:700}}>
          <div style={{marginBottom:8,fontSize:13,color:'var(--text-2)',fontWeight:500}}>{dateStr}</div>
          <div style={{fontSize:26,fontWeight:800,marginBottom:4}}>Pilih Sesi Penjualan</div>
          <div style={{fontSize:14,color:'var(--text-2)',marginBottom:32}}>Halo, <strong>{user.name}</strong>! Pilih sesi untuk memulai aktivitas hari ini.</div>

          {/* Session Cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14,marginBottom:16}}>
            {sessions.map(s => (
              <div
                key={s.id}
                onMouseEnter={()=>setHovered(s.id)}
                onMouseLeave={()=>setHovered(null)}
                onClick={()=>onSelectSession(s)}
                style={{
                  background:'#fff',
                  border:`1.5px solid ${hovered===s.id ? s.accent : 'var(--border)'}`,
                  borderRadius:14,
                  padding:22,
                  cursor:'pointer',
                  transition:'all 0.18s',
                  transform: hovered===s.id ? 'translateY(-2px)' : 'none',
                  boxShadow: hovered===s.id ? '0 8px 24px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
                  display:'flex',
                  alignItems:'flex-start',
                  gap:16,
                }}
              >
                <div style={{width:52,height:52,borderRadius:12,background:s.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <SessionIcon type={s.type} color={s.accent} size={24} />
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontSize:16,fontWeight:800}}>{s.label}</span>
                    <span className={`badge ${s.type==='toko'?'badge-amber':'badge-blue'}`} style={{fontSize:10}}>
                      {s.type==='toko'?'Toko Tetap':'Bazar'}
                    </span>
                  </div>
                  <div style={{fontSize:13,color:'var(--text-2)',lineHeight:1.4}}>{s.location}</div>
                </div>
                <div style={{color: hovered===s.id ? s.accent : 'var(--text-3)',transition:'color 0.15s',marginTop:2}}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            ))}

            {/* Add Session */}
            {!showAdd ? (
              <div
                onClick={()=>setShowAdd(true)}
                style={{
                  border:'1.5px dashed var(--border)',
                  borderRadius:14,
                  padding:22,
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  gap:10,
                  color:'var(--text-2)',
                  fontSize:13.5,
                  fontWeight:600,
                  transition:'all 0.15s',
                  background: hovered==='add' ? 'var(--surface)' : 'transparent',
                  minHeight: 88,
                }}
                onMouseEnter={()=>setHovered('add')}
                onMouseLeave={()=>setHovered(null)}
              >
                <div style={{width:28,height:28,borderRadius:8,background:'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Icon name="plus" size={14} color="var(--text-2)" />
                </div>
                Tambah Sesi Bazar
              </div>
            ) : (
              <div style={{background:'#fff',border:'1.5px solid var(--accent)',borderRadius:14,padding:22}}>
                <div style={{fontSize:13.5,fontWeight:700,marginBottom:12}}>Sesi Bazar Baru</div>
                <input className="input" placeholder="Nama sesi (mis: Bazar D)" value={newName} onChange={e=>setNewName(e.target.value)} style={{marginBottom:8}} />
                <input className="input" placeholder="Lokasi (opsional)" value={newLoc} onChange={e=>setNewLoc(e.target.value)} style={{marginBottom:12}} />
                <div style={{display:'flex',gap:8}}>
                  <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={()=>setShowAdd(false)}>Batal</button>
                  <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={handleAdd}>Tambah</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sidebar ────────────────────────────────────────────
const NAV = [
  { section: 'Utama' },
  { id:'dashboard', label:'Dashboard', icon:'dashboard' },
  { id:'kasir', label:'Kasir / POS', icon:'pos' },
  { section: 'Inventori' },
  { id:'katalog', label:'Katalog Produk', icon:'catalog' },
  { id:'stok', label:'Manajemen Stok', icon:'stock' },
  { section: 'Penjualan' },
  { id:'riwayat', label:'Riwayat Transaksi', icon:'history' },
  { id:'laporan', label:'Laporan & Analitik', icon:'laporan' },
  { id:'event', label:'Event & Bazar', icon:'event' },
  { id:'promosi', label:'Promosi', icon:'promo' },
  { section: 'Sistem' },
  { id:'pengguna', label:'Pengguna', icon:'users' },
  { id:'pengaturan', label:'Pengaturan', icon:'settings' },
];

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  kasir: 'Kasir / Point of Sale',
  katalog: 'Katalog Produk',
  stok: 'Manajemen Stok',
  riwayat: 'Riwayat Transaksi',
  laporan: 'Laporan & Analitik',
  event: 'Event & Bazar',
  promosi: 'Promosi',
  pengguna: 'Pengguna',
  pengaturan: 'Pengaturan',
};

const Sidebar = ({ active, onNav, user, session, onChangeSession }) => (
  <div className="sidebar">
    <div className="sidebar-logo">
      <div className="brand">nyam.</div>
      <div className="sub">Point of Sale</div>
    </div>
    {/* Session Badge */}
    <div style={{padding:'10px 12px 4px',margin:'0 8px'}}>
      <div style={{background:'var(--sidebar-active)',borderRadius:8,padding:'8px 10px',cursor:'pointer'}} onClick={onChangeSession}>
        <div style={{fontSize:10,fontWeight:700,color:'var(--sidebar-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:2}}>Sesi Aktif</div>
        <div style={{fontSize:12.5,fontWeight:700,color:'var(--sidebar-text)',lineHeight:1.3}}>{session.label}</div>
        <div style={{fontSize:11,color:'var(--sidebar-muted)',marginTop:2}}>Ganti sesi ↗</div>
      </div>
    </div>
    <nav className="sidebar-nav">
      {NAV.map((n, i) => n.section
        ? <div key={i} className="nav-section">{n.section}</div>
        : (
          <div key={n.id} className={`nav-item${active===n.id?' active':''}`} onClick={() => onNav(n.id)}>
            <span className="icon"><Icon name={n.icon} size={17} /></span>
            <span>{n.label}</span>
          </div>
        )
      )}
    </nav>
    <div className="sidebar-footer">
      <div className="user-card">
        <div className="user-avatar">{user.avatar}</div>
        <div>
          <div className="user-name">{user.name}</div>
          <div className="user-role">{user.role}</div>
        </div>
      </div>
    </div>
  </div>
);

// ── Topbar ─────────────────────────────────────────────
const Topbar = ({ page, session, onLogout }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  return (
    <div className="topbar">
      <div className="topbar-title">{PAGE_TITLES[page]}</div>
      <div style={{marginLeft:10}}>
        <span className="badge badge-amber" style={{fontSize:11}}>{session.label}</span>
      </div>
      <div className="topbar-spacer"></div>
      <div className="topbar-date">{dateStr}</div>
      <button className="btn btn-ghost btn-sm" onClick={onLogout} style={{color:'var(--text-2)',marginLeft:8}}>Keluar</button>
    </div>
  );
};

// ── App ────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "#c07a3b",
  "density": "default",
  "sidebarStyle": "dark"
}/*EDITMODE-END*/;

const App = () => {
  const [screen, setScreen] = React.useState('login'); // 'login' | 'session' | 'pos'
  const [user, setUser] = React.useState(null);
  const [session, setSession] = React.useState(null);
  const [page, setPage] = React.useState('dashboard');
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', tweaks.accentColor);
  }, [tweaks.accentColor]);

  React.useEffect(() => {
    if (tweaks.sidebarStyle === 'light') {
      document.documentElement.style.setProperty('--sidebar', '#ffffff');
      document.documentElement.style.setProperty('--sidebar-hover', '#f4efe8');
      document.documentElement.style.setProperty('--sidebar-active', '#ede7de');
      document.documentElement.style.setProperty('--sidebar-text', '#1c1915');
      document.documentElement.style.setProperty('--sidebar-muted', '#8a8279');
    } else {
      document.documentElement.style.setProperty('--sidebar', '#1e1b18');
      document.documentElement.style.setProperty('--sidebar-hover', '#2a2620');
      document.documentElement.style.setProperty('--sidebar-active', '#2d2922');
      document.documentElement.style.setProperty('--sidebar-text', '#e8e2d9');
      document.documentElement.style.setProperty('--sidebar-muted', '#7a7268');
    }
  }, [tweaks.sidebarStyle]);

  const handleLogin = u => { setUser(u); setScreen('session'); };
  const handleSession = s => { setSession(s); setScreen('pos'); setPage('dashboard'); };
  const handleLogout = () => { setUser(null); setSession(null); setScreen('login'); };
  const handleChangeSession = () => setScreen('session');

  const pages = { dashboard: Dashboard, kasir: Kasir, katalog: Katalog, stok: Stok, riwayat: Riwayat, laporan: Laporan, event: EventBazar, promosi: Promosi, pengguna: Pengguna, pengaturan: Pengaturan };
  const PageComponent = pages[page] || Dashboard;

  if (screen === 'login') return <LoginPage onLogin={handleLogin} />;
  if (screen === 'session') return <SessionPage user={user} onSelectSession={handleSession} onLogout={handleLogout} />;

  return (
    <div className="layout">
      <Sidebar active={page} onNav={setPage} user={user} session={session} onChangeSession={handleChangeSession} />
      <div className="main">
        <Topbar page={page} session={session} onLogout={handleLogout} />
        <PageComponent />
      </div>
      <TweaksPanel>
        <TweakSection title="Warna Aksen">
          <TweakColor id="accentColor" label="Warna Utama" />
        </TweakSection>
        <TweakSection title="Tampilan">
          <TweakRadio id="density" label="Kepadatan" options={['compact','default','spacious']} />
          <TweakRadio id="sidebarStyle" label="Sidebar" options={['dark','light']} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
