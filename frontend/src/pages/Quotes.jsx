import React, { useState } from 'react';
import { FileText, Search, Send, Clipboard, Check, FileDown, Plus, Truck } from 'lucide-react';
import { getQuotes, getForwarders, updateQuoteStatus, dispatchEmails, printQuotePDF, copyEmailTemplate } from '../storage.js';

function StatusBadge({ status }) {
  const cls = status === 'Sent'
    ? 'bg-orange-100 text-[#F97316] border border-[#F97316]/10'
    : 'bg-emerald-50 text-emerald-800 border border-emerald-200';
  return <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${cls}`}>{status}</span>;
}

function DetailPanel({ q, onClose, onDispatch, onPrint, onCopy, copied }) {
  if (!q) return (
    <div className="bg-white border border-[#FFE5CC] rounded-2xl p-8 text-center sticky top-6 flex flex-col items-center justify-center py-20 shadow-sm">
      <FileText className="w-12 h-12 text-[#FFE5CC] mb-3" />
      <p className="text-xs font-bold text-[#4B3A2A]">Select a record</p>
      <p className="text-[10px] text-[#8C7560] mt-1">Click any quotation to view full details and actions.</p>
    </div>
  );

  const row = (label, value) => (
    <div key={label}>
      <span className="text-[10px] text-[#8C7560] font-medium block">{label}</span>
      <span className="text-xs font-semibold text-[#1C1009]">{value}</span>
    </div>
  );

  return (
    <div className="bg-white border border-[#FFE5CC] rounded-2xl p-6 shadow-sm space-y-5 sticky top-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#FFE5CC]">
        <div>
          <span className="text-[10px] text-[#8C7560] uppercase font-bold tracking-wider">Quotation Focus</span>
          <h3 className="text-sm font-bold font-mono text-[#1C1009]">{q.referenceId}</h3>
        </div>
        <button onClick={onClose} className="text-[#8C7560] hover:text-[#F97316] font-bold text-sm">✕</button>
      </div>

      {/* Route */}
      <div className="border-l-2 border-dashed border-[#F97316]/40 ml-4 space-y-5 py-2">
        {['Origin', 'Destination'].map((lbl, i) => (
          <div key={lbl} className="relative pl-6">
            <div className="absolute -left-[17px] top-0.5 w-6 h-6 rounded-full bg-[#FFF1E0] border border-[#F97316] flex items-center justify-center text-[10px] font-bold text-[#F97316]">{i===0?'A':'B'}</div>
            <strong className="text-xs text-[#1C1009] block">{lbl}</strong>
            <p className="text-xs text-[#4B3A2A]">{i===0?q.origin:q.destination}</p>
          </div>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 text-xs border-t border-[#FFE5CC] pt-4">
        {row('Mode', q.mode)}
        {row('Cargo', q.cargoType)}
        {row('Weight', `${q.weight} kg`)}
        {row('Incoterms', q.incoterms)}
        {row('Dimensions', q.dimensions||'N/A')}
        {row('Value', q.declaredValue?`$${Number(q.declaredValue).toLocaleString()}`:'N/A')}
        {row('Ready', q.readyDate||'ASAP')}
        {row('Deadline', q.deadline||'ASAP')}
        {q.emailedCount > 0 && row('Emailed', `${q.emailedCount} forwarders`)}
      </div>

      {q.specialInstructions && (
        <div className="bg-[#FFFBF5] p-3 rounded-xl border border-[#FFE5CC] text-xs text-[#4B3A2A] italic">
          <strong className="text-[10px] text-[#F97316] uppercase not-italic block mb-1">Instructions</strong>
          "{q.specialInstructions}"
        </div>
      )}

      {q.status === 'Pending' && (
        <button onClick={() => onDispatch(q)} className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white py-2.5 rounded-xl text-xs font-bold transition-all">
          <Send className="w-3.5 h-3.5" /> Dispatch Emails Now
        </button>
      )}

      <div className="flex gap-2 border-t border-[#FFE5CC] pt-4">
        <button onClick={() => onCopy(q)} className="flex-1 flex items-center justify-center gap-1.5 bg-[#FFF1E0] hover:bg-[#FFE5CC] text-[#F97316] py-2.5 rounded-xl text-xs font-bold transition-all border border-[#FFE5CC]">
          {copied === q.id ? <><Check className="w-4 h-4 text-emerald-600"/>Copied!</> : <><Clipboard className="w-4 h-4"/>Copy Template</>}
        </button>
        <button onClick={() => onPrint(q)} className="p-2.5 bg-white border border-[#FFE5CC] rounded-xl text-[#4B3A2A] hover:bg-[#FFF8F0] transition-all">
          <FileDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Quotes({ showToast, onNewQuote }) {
  const [quotes, setQuotes]     = useState(getQuotes);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [copied, setCopied]     = useState(null);

  const refresh = () => { setQuotes(getQuotes()); };

  const handleDispatch = async (q) => {
    const fwds = getForwarders();
    if (!fwds.length) { showToast('Add forwarders first.', 'error'); return; }
    showToast('Dispatching emails…');
    try {
      const res = await dispatchEmails(q, fwds);
      updateQuoteStatus(q.id, 'Sent', res.sentCount ?? fwds.length);
      showToast(res.isMock ? 'Mock: previewed in Vite console.' : `Sent to ${res.sentCount} forwarders!`);
      refresh();
      if (selected?.id === q.id) setSelected({ ...q, status: 'Sent', emailedCount: res.sentCount ?? fwds.length });
    } catch { showToast('Email dispatch failed.', 'error'); }
  };

  const handleCopy = (q) => {
    copyEmailTemplate(q);
    setCopied(q.id);
    showToast('Email template copied to clipboard!');
    setTimeout(() => setCopied(null), 3000);
  };

  const filtered = quotes.filter(q =>
    [q.referenceId, q.origin, q.destination, q.cargoType].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1C1009]">Quotation History</h2>
          <p className="text-sm text-[#4B3A2A] mt-1">Browse all past bid campaigns. Re-dispatch, copy templates, or export PDFs.</p>
        </div>
        <button onClick={onNewQuote} className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm self-start">
          <Plus className="w-4 h-4" /> New Shipment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#FFE5CC] rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-[#8C7560] shrink-0" />
            <input type="text" placeholder="Search by reference, origin, destination…" value={search} onChange={e=>setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#1C1009] placeholder:text-[#8C7560] focus:outline-none" />
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white border border-[#FFE5CC] rounded-2xl p-16 text-center shadow-sm flex flex-col items-center">
              <FileText className="w-14 h-14 text-[#FFE5CC] mb-4" />
              <h3 className="text-lg font-bold text-[#1C1009]">No campaigns yet</h3>
              <button onClick={onNewQuote} className="mt-4 bg-[#F97316] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#EA580C] transition-all">Dispatch First Shipment</button>
            </div>
          ) : filtered.map(q => (
            <div key={q.id} onClick={()=>setSelected(q)}
              className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 ${selected?.id===q.id?'border-[#F97316] ring-1 ring-[#F97316]/20':'border-[#FFE5CC] hover:border-[#F97316]/30'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-[#1C1009]">{q.referenceId}</span>
                    <StatusBadge status={q.status} />
                    <span className="text-[10px] bg-[#FFF8F0] border border-[#FFE5CC] text-[#8C7560] px-2 py-0.5 rounded-full font-bold">{q.mode}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div><span className="text-[#8C7560]">From</span> <strong className="text-[#1C1009]">{q.origin}</strong></div>
                    <div><span className="text-[#8C7560]">To</span> <strong className="text-[#1C1009]">{q.destination}</strong></div>
                  </div>
                  <div className="flex gap-3 text-[10px] text-[#8C7560] font-semibold pt-1 border-t border-[#FFF8F0]">
                    <span>{q.cargoType}</span><span>·</span><span>{q.weight} kg</span>
                    {q.declaredValue > 0 && <><span>·</span><span>${Number(q.declaredValue).toLocaleString()}</span></>}
                  </div>
                </div>
                <div className="flex md:flex-col items-center md:items-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-0 border-[#FFF8F0]">
                  <span className="text-xs text-[#8C7560] font-semibold">{new Date(q.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</span>
                  <div className="flex gap-1.5">
                    <button onClick={e=>{e.stopPropagation();handleCopy(q);}} className="p-2 bg-[#FFFBF5] border border-[#FFE5CC] rounded-xl text-[#8C7560] hover:text-[#F97316] transition-all" title="Copy email template">
                      {copied===q.id?<Check className="w-4 h-4 text-emerald-600"/>:<Clipboard className="w-4 h-4"/>}
                    </button>
                    <button onClick={e=>{e.stopPropagation();printQuotePDF(q);}} className="p-2 bg-[#FFFBF5] border border-[#FFE5CC] rounded-xl text-[#8C7560] hover:text-[#F97316] transition-all" title="Export PDF">
                      <FileDown className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Detail panel */}
        <div className="lg:col-span-1">
          <DetailPanel q={selected} onClose={()=>setSelected(null)} onDispatch={handleDispatch} onPrint={printQuotePDF} onCopy={handleCopy} copied={copied} />
        </div>
      </div>
    </div>
  );
}
