import React, { useState, useEffect } from 'react';
import { Building2, Activity, FileText, Plus, AlertCircle, HardDrive, User, Inbox as InboxIcon, Menu, X } from 'lucide-react';
import { initStorage, getForwarders, getQuotes, getBids } from './storage.js';
import Dashboard  from './pages/Dashboard.jsx';
import Forwarders from './pages/Forwarders.jsx';
import NewQuote   from './pages/NewQuote.jsx';
import Quotes     from './pages/Quotes.jsx';
import Inbox      from './pages/Inbox.jsx';
import Profile    from './pages/Profile.jsx';

// Seed localStorage once on first load
initStorage();

export default function App() {
  const [tab, setTab]           = useState('dashboard');
  const [openModal, setOpenModal] = useState(false);   // for "Add Forwarder" shortcut
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast]       = useState(null);
  const [profileName, setProfileName] = useState('Logistics Manager');

  useEffect(() => {
    const updateProfileName = () => {
      const saved = localStorage.getItem('fb_company_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.companyName) setProfileName(parsed.companyName);
        } catch {}
      }
    };
    updateProfileName();
    window.addEventListener('storage_profile_updated', updateProfileName);
    return () => window.removeEventListener('storage_profile_updated', updateProfileName);
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Navigate helper — optionally trigger modal on Forwarders page
  const navigate = (dest, withModal = false) => {
    setTab(dest);
    setMobileMenuOpen(false); // Close menu on navigation
    if (withModal) setOpenModal(true);
  };

  // Counts for sidebar badges
  const [counts, setCounts] = useState({ fwds: 0, quotes: 0, bids: 0 });
  useEffect(() => {
    const refresh = () => setCounts({ 
      fwds: getForwarders().length, 
      quotes: getQuotes().length,
      bids: getBids().filter(b => b.status === 'pending').length
    });
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [tab]);

  const NAV = [
    { id: 'dashboard',  label: 'Control Center',      Icon: Activity  },
    { id: 'inbox',      label: 'AI Bid Inbox',        Icon: InboxIcon, badge: counts.bids > 0 ? counts.bids : null },
    { id: 'forwarders', label: 'Forwarder CRM',       Icon: Building2, badge: counts.fwds   },
    { id: 'new-quote',  label: 'Dispatch Shipment',   Icon: Plus       },
    { id: 'quotes',     label: 'Quotation History',   Icon: FileText,  badge: counts.quotes },
    { id: 'profile',    label: 'Company Profile',     Icon: User       },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex overflow-hidden">
      
      {/* ── Mobile Sidebar Overlay ── */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#1C1009]/50 z-40 lg:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 w-68 bg-white border-r border-[#FFE5CC] flex flex-col shrink-0`} style={{width:'272px'}}>
        {/* Logo */}
        <div className="p-5 lg:p-7 border-b border-[#FFE5CC] flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F97316] flex items-center justify-center shadow-[0_0_15px_2px_rgba(249,115,22,0.15)] shrink-0">
              <Building2 className="w-6 h-6 text-white"/>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1C1009] m-0 leading-none">FreightBid</h1>
              <p className="text-[11px] text-[#8C7560] font-medium mt-1">Logistics Controller</p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-2 text-[#8C7560] hover:bg-[#FFF8F0] rounded-xl transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, Icon, badge }) => (
            <button key={id} onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                tab === id
                  ? 'bg-[#FFF1E0] text-[#F97316] font-semibold'
                  : 'text-[#4B3A2A] hover:bg-[#FFF8F0] hover:text-[#F97316]'
              }`}>
              <Icon className="w-5 h-5 shrink-0"/>
              {label}
              {badge != null && (
                <span className="ml-auto bg-[#F97316]/10 text-[#F97316] px-2 py-0.5 rounded-full text-[10px] font-bold">{badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Storage indicator */}
        <div className="m-4 p-4 bg-[#FFFBF5] border border-[#FFE5CC] rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive className="w-4 h-4 text-[#F97316]"/>
            <span className="text-xs font-bold text-[#4B3A2A]">Local Storage</span>
          </div>
          <p className="text-[10px] text-[#8C7560] leading-relaxed">All data is stored in your browser. Email sending uses Resend via the server.</p>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">

        {/* Top bar */}
        <header className="h-16 lg:h-20 bg-white border-b border-[#FFE5CC] flex items-center justify-between px-4 lg:px-10 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-[#8C7560] hover:bg-[#FFF8F0] rounded-xl transition-colors">
              <Menu className="w-6 h-6"/>
            </button>
            <span className="text-[10px] sm:text-xs bg-[#F97316]/10 text-[#F97316] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap">Main Network</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-6 border-r border-[#FFE5CC] pr-6 text-sm">
              <div><span className="text-[#8C7560] text-xs block">Dispatched</span><span className="font-bold text-[#1C1009]">{getQuotes().filter(q=>q.status==='Sent').length} Bids</span></div>
              <div><span className="text-[#8C7560] text-xs block">Network</span><span className="font-bold text-[#1C1009]">{getForwarders().length} Agencies</span></div>
            </div>
            <button onClick={() => navigate('profile')} className="w-8 h-8 lg:w-9 lg:h-9 shrink-0 rounded-full bg-[#FFF1E0] border border-[#F97316]/20 flex items-center justify-center text-[#F97316] hover:bg-[#FFF1E0]/80 transition-all outline-none">
              <User className="w-4 h-4 lg:w-5 lg:h-5"/>
            </button>
            <span className="hidden sm:inline font-semibold text-sm text-[#1C1009] cursor-pointer hover:text-[#F97316] transition-all" onClick={() => navigate('profile')}>{profileName}</span>
          </div>
        </header>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type==='error'   ? 'bg-rose-50 border-rose-200 text-rose-800' :
            toast.type==='warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
            'bg-[#FFF8F0] border-[#FFE5CC] text-[#1C1009]'
          }`}>
            <AlertCircle className={`w-5 h-5 shrink-0 ${toast.type==='error'?'text-rose-500':toast.type==='warning'?'text-amber-500':'text-[#F97316]'}`}/>
            {toast.msg}
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 bg-[#FFF8F0]/40 overflow-x-hidden w-full">
          {tab === 'dashboard'  && <Dashboard  showToast={showToast} onNavigate={navigate}/>}
          {tab === 'inbox'      && <Inbox      showToast={showToast} />}
          {tab === 'forwarders' && <Forwarders showToast={showToast} openModal={openModal} onModalClosed={() => setOpenModal(false)}/>}
          {tab === 'new-quote'  && <NewQuote   showToast={showToast} onViewHistory={() => setTab('quotes')}/>}
          {tab === 'quotes'     && <Quotes     showToast={showToast} onNewQuote={() => setTab('new-quote')}/>}
          {tab === 'profile'    && <Profile    showToast={showToast} />}
        </main>
      </div>
    </div>
  );
}
