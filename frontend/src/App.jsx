import React, { useState, useEffect } from 'react';
import { Building2, Activity, FileText, Plus, AlertCircle, HardDrive, User } from 'lucide-react';
import { initStorage, getForwarders, getQuotes } from './storage.js';
import Dashboard  from './pages/Dashboard.jsx';
import Forwarders from './pages/Forwarders.jsx';
import NewQuote   from './pages/NewQuote.jsx';
import Quotes     from './pages/Quotes.jsx';

// Seed localStorage once on first load
initStorage();

export default function App() {
  const [tab, setTab]           = useState('dashboard');
  const [openModal, setOpenModal] = useState(false);   // for "Add Forwarder" shortcut
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Navigate helper — optionally trigger modal on Forwarders page
  const navigate = (dest, withModal = false) => {
    setTab(dest);
    if (withModal) setOpenModal(true);
  };

  // Counts for sidebar badges
  const [counts, setCounts] = useState({ fwds: 0, quotes: 0 });
  useEffect(() => {
    const refresh = () => setCounts({ fwds: getForwarders().length, quotes: getQuotes().length });
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [tab]);

  const NAV = [
    { id: 'dashboard', label: 'Control Center',      Icon: Activity  },
    { id: 'forwarders', label: 'Forwarder CRM',      Icon: Building2, badge: counts.fwds   },
    { id: 'new-quote',  label: 'Dispatch Shipment',  Icon: Plus       },
    { id: 'quotes',     label: 'Quotation History',  Icon: FileText,  badge: counts.quotes },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-68 bg-white border-r border-[#FFE5CC] flex flex-col shrink-0" style={{width:'272px'}}>
        {/* Logo */}
        <div className="p-7 border-b border-[#FFE5CC] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F97316] flex items-center justify-center shadow-[0_0_15px_2px_rgba(249,115,22,0.15)]">
            <Building2 className="w-6 h-6 text-white"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1C1009] m-0 leading-none">FreightBid</h1>
            <p className="text-[11px] text-[#8C7560] font-medium mt-1">Logistics Controller</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-5 space-y-1">
          {NAV.map(({ id, label, Icon, badge }) => (
            <button key={id} onClick={() => setTab(id)}
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
      <div className="flex-1 flex flex-col overflow-y-auto max-h-screen">

        {/* Top bar */}
        <header className="h-20 bg-white border-b border-[#FFE5CC] flex items-center justify-between px-10 shrink-0">
          <span className="text-xs bg-[#F97316]/10 text-[#F97316] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">Main Network</span>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-6 border-r border-[#FFE5CC] pr-6 text-sm">
              <div><span className="text-[#8C7560] text-xs block">Dispatched</span><span className="font-bold text-[#1C1009]">{getQuotes().filter(q=>q.status==='Sent').length} Bids</span></div>
              <div><span className="text-[#8C7560] text-xs block">Network</span><span className="font-bold text-[#1C1009]">{getForwarders().length} Agencies</span></div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#FFF1E0] border border-[#F97316]/20 flex items-center justify-center text-[#F97316]">
              <User className="w-5 h-5"/>
            </div>
            <span className="font-semibold text-sm text-[#1C1009]">Logistics Manager</span>
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
        <main className="flex-1 p-10 bg-[#FFF8F0]/40">
          {tab === 'dashboard'  && <Dashboard  showToast={showToast} onNavigate={navigate}/>}
          {tab === 'forwarders' && <Forwarders showToast={showToast} openModal={openModal} onModalClosed={() => setOpenModal(false)}/>}
          {tab === 'new-quote'  && <NewQuote   showToast={showToast} onViewHistory={() => setTab('quotes')}/>}
          {tab === 'quotes'     && <Quotes     showToast={showToast} onNewQuote={() => setTab('new-quote')}/>}
        </main>
      </div>
    </div>
  );
}
