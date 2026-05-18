import React, { useState, useEffect } from 'react';
import { Activity, Building2, FileText, Plus, Send, Truck, Mail, Clock, Inbox as InboxIcon } from 'lucide-react';
import { getForwarders, getQuotes, updateQuoteStatus, dispatchEmails, getBids } from '../storage.js';

export default function Dashboard({ showToast, onNavigate }) {
  const [fwds, setFwds]     = useState(getForwarders);
  const [quotes, setQuotes] = useState(getQuotes);

  // Refresh when tab becomes visible again
  useEffect(() => {
    const onFocus = () => { setFwds(getForwarders()); setQuotes(getQuotes()); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const sent    = quotes.filter(q => q.status === 'Sent');
  const pending = quotes.filter(q => q.status === 'Pending');
  const totalEmailed = quotes.reduce((n, q) => n + (q.emailedCount || 0), 0);

  const handleDispatch = async (q) => {
    const forwarders = getForwarders();
    if (!forwarders.length) { showToast('Add forwarders first.', 'error'); return; }
    showToast('Dispatching…');
    try {
      const res = await dispatchEmails(q, forwarders);
      updateQuoteStatus(q.id, 'Sent', res.sentCount ?? forwarders.length);
      setQuotes(getQuotes());
      showToast(res.isMock ? 'Mock: preview in Vite console.' : `Sent to ${res.sentCount} forwarders!`);
    } catch { showToast('Email dispatch failed.', 'error'); }
  };

  const Stat = ({ icon, label, value, color }) => (
    <div className="bg-white border border-[#FFE5CC] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-50 -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-300" style={{background:`${color}15`}}/>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7560]">{label}</span>
        <div className="p-2.5 rounded-xl" style={{background:`${color}15`,color}}>{icon}</div>
      </div>
      <span className="text-3xl font-bold text-[#1C1009] block">{value}</span>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[#1C1009]">Shipment Control Room</h2>
          <p className="text-sm text-[#4B3A2A] mt-1">Monitor campaigns, review bids, and manage your logistics network.</p>
        </div>
        <button onClick={() => onNavigate('inbox')} className="bg-white border border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2">
          <InboxIcon className="w-4 h-4"/> Go to Bid Inbox
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Stat icon={<Send className="w-5 h-5"/>}     label="Bids Dispatched"    value={sent.length}       color="#F97316"/>
        <Stat icon={<InboxIcon className="w-5 h-5"/>} label="Bids Received"      value={getBids().length}  color="#F59E0B"/>
        <Stat icon={<Clock className="w-5 h-5"/>}     label="Pending Actions"    value={getBids().filter(b=>b.status==='pending').length} color="#10B981"/>
        <Stat icon={<Building2 className="w-5 h-5"/>} label="Forwarder Network"  value={fwds.length}       color="#3B82F6"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent shipments */}
        <div className="lg:col-span-2 bg-white border border-[#FFE5CC] rounded-2xl p-6 lg:p-8 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#FFE5CC]">
            <h3 className="text-base font-bold text-[#1C1009]">Recent Campaigns</h3>
            <button onClick={() => onNavigate('quotes')} className="text-xs text-[#F97316] font-bold hover:text-[#EA580C] shrink-0">View All →</button>
          </div>

          {quotes.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center">
              <FileText className="w-12 h-12 text-[#FFE5CC] mb-3"/>
              <p className="text-sm font-semibold text-[#8C7560]">No quotation history yet.</p>
              <button onClick={() => onNavigate('new-quote')} className="mt-3 bg-[#F97316] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#EA580C] transition-all">Submit First Dispatch</button>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.slice(0, 5).map(q => (
                <div key={q.id} className="p-4 bg-[#FFFBF5] rounded-xl border border-[#FFE5CC] flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 shrink-0 bg-white border border-[#FFE5CC] rounded-full flex items-center justify-center text-[#F97316]">
                      <Truck className="w-4 h-4"/>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-[#1C1009]">{q.referenceId}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${q.status==='Sent'?'bg-orange-100 text-[#F97316]':'bg-emerald-50 text-emerald-800'}`}>{q.status}</span>
                      </div>
                      <p className="text-xs text-[#4B3A2A] mt-0.5 truncate"><strong>{q.origin}</strong> → <strong>{q.destination}</strong></p>
                      <span className="text-[10px] text-[#8C7560] block truncate">{q.mode} · {q.cargoType} · {q.weight} kg</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <span className="text-xs text-[#8C7560] font-semibold shrink-0">{new Date(q.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span>
                    {q.status==='Pending' && (
                      <button onClick={()=>handleDispatch(q)} className="flex items-center gap-1 text-xs bg-[#F97316] hover:bg-[#EA580C] text-white px-3 py-1.5 rounded-xl font-bold transition-all">
                        <Send className="w-3 h-3"/> Send
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions + partner list */}
        <div className="space-y-6">
          <div className="bg-white border border-[#FFE5CC] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#1C1009] mb-1">Quick Actions</h3>
            <p className="text-xs text-[#8C7560] mb-4">Jump to common tasks instantly.</p>
            <div className="space-y-2">
              <button onClick={() => onNavigate('forwarders', true)} className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white py-2.5 rounded-xl text-sm font-bold transition-all">
                <Plus className="w-4 h-4"/> Add Forwarder
              </button>
              <button onClick={() => onNavigate('new-quote')} className="w-full flex items-center justify-center gap-2 bg-[#FFF1E0] hover:bg-[#FFE5CC] border border-[#FFE5CC] text-[#F97316] py-2.5 rounded-xl text-sm font-bold transition-all">
                <Send className="w-4 h-4"/> Dispatch Shipment
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#FFE5CC] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#FFE5CC]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1009]">Registered Agencies</h3>
              <span className="text-xs font-bold text-[#F97316]">{fwds.length}</span>
            </div>
            {fwds.length === 0
              ? <p className="text-xs text-[#8C7560] text-center py-4">No partners yet.</p>
              : <div className="space-y-3 max-h-52 overflow-y-auto scrollbar-thin pr-1">
                  {fwds.map(f => (
                    <div key={f.id} className="flex items-center justify-between text-xs gap-2">
                      <div className="min-w-0">
                        <span className="font-semibold text-[#1C1009] block truncate">{f.company}</span>
                        <span className="text-[10px] text-[#8C7560]">{f.name}</span>
                      </div>
                      <span className="text-[10px] bg-[#FFF8F0] px-2 py-0.5 rounded-full border border-[#FFE5CC] text-[#4B3A2A] truncate max-w-[120px] shrink-0">{f.email}</span>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
