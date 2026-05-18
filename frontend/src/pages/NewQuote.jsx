import React, { useState } from 'react';
import { Send, FileText, MapPin, Scale, Layers, DollarSign, Truck, Building2, Calendar, Clock, Check, FileDown } from 'lucide-react';
import { getForwarders, addQuote, updateQuoteStatus, genRefId, dispatchEmails, printQuotePDF } from '../storage.js';

const BLANK = { origin:'', destination:'', cargoType:'General', weight:'', dimensions:'', declaredValue:'', incoterms:'EXW', mode:'Air', readyDate:'', specialInstructions:'', deadline:'' };

function SuccessScreen({ quote, forwarders, onViewHistory, onPrint }) {
  return (
    <div className="bg-white border border-[#FFE5CC] rounded-2xl p-12 shadow-sm text-center space-y-8 max-w-2xl mx-auto">
      {/* Animated checkmark */}
      <div className="success-checkmark"><div className="check-icon">
        <span className="icon-line line-tip"></span>
        <span className="icon-line line-long"></span>
        <div className="icon-circle"></div>
        <div className="icon-fix"></div>
      </div></div>

      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-[#1C1009]">Campaign Dispatched!</h3>
        <p className="text-sm text-[#4B3A2A] max-w-md mx-auto">
          Quotation <span className="font-mono font-bold text-[#F97316]">{quote.referenceId}</span> saved and bid emails sent to <strong>{quote.emailedCount || forwarders.length}</strong> forwarders.
        </p>
      </div>

      <div className="bg-[#FFFBF5] border border-[#FFE5CC] rounded-xl p-5 text-left grid grid-cols-2 gap-3 text-xs max-w-md mx-auto">
        <div><span className="text-[#8C7560] block">Reference ID</span><span className="font-mono font-bold text-[#1C1009]">{quote.referenceId}</span></div>
        <div><span className="text-[#8C7560] block">Forwarders Emailed</span><span className="font-bold text-[#1C1009]">{quote.emailedCount || forwarders.length}</span></div>
        <div><span className="text-[#8C7560] block">Route</span><span className="font-bold text-[#1C1009]">{quote.origin} → {quote.destination}</span></div>
        <div><span className="text-[#8C7560] block">Mode</span><span className="font-bold text-[#1C1009]">{quote.mode} · {quote.cargoType}</span></div>
      </div>

      <div className="flex justify-center gap-3">
        <button onClick={onPrint} className="flex items-center gap-2 bg-[#FFF8F0] border border-[#FFE5CC] text-[#4B3A2A] px-5 py-3 rounded-xl font-bold text-sm hover:bg-[#FFF1E0] transition-all">
          <FileDown className="w-4 h-4" /> Export PDF
        </button>
        <button onClick={onViewHistory} className="bg-[#F97316] hover:bg-[#EA580C] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-sm">
          View History
        </button>
      </div>
    </div>
  );
}

export default function NewQuote({ showToast, onViewHistory }) {
  const [form, setForm]         = useState(BLANK);
  const [refId]                 = useState(genRefId);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const inp  = "w-full p-3 bg-[#FFFBF5] border border-[#FFE5CC] rounded-xl text-sm text-[#1C1009] focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] focus:outline-none transition-all";
  const lbl  = (icon) => <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1C1009] mb-2">{icon}</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const forwarders = getForwarders();
    if (forwarders.length === 0) { showToast('Add at least one forwarder first.', 'error'); return; }

    setSubmitting(true);
    const q = addQuote({ ...form, referenceId: refId, weight: Number(form.weight), declaredValue: Number(form.declaredValue) });

    try {
      const result = await dispatchEmails(q, forwarders);
      updateQuoteStatus(q.id, 'Sent', result.sentCount ?? forwarders.length);
      q.emailedCount = result.sentCount ?? forwarders.length;
      q.status = 'Sent';
      showToast(result.isMock ? `Mock mode: emails previewed in Vite console.` : `Emails dispatched to ${result.sentCount} forwarders!`);
    } catch {
      showToast('Saved, but email dispatch failed. Check Vite console.', 'warning');
    }

    setSubmitting(false);
    setSuccess(q);
  };

  if (success) return (
    <SuccessScreen
      quote={success}
      forwarders={getForwarders()}
      onViewHistory={onViewHistory}
      onPrint={() => printQuotePDF(success)}
    />
  );

  const OIcon = <MapPin className="w-3.5 h-3.5 text-[#F97316]" />;
  const fwdCount = getForwarders().length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-[#1C1009]">Dispatch Shipment Quotation</h2>
        <p className="text-sm text-[#4B3A2A] mt-1">Fill in cargo details and submit — bid emails go to all <strong>{fwdCount}</strong> registered forwarders instantly.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#FFE5CC] rounded-2xl p-8 shadow-sm space-y-8">
        {/* Ref ID banner */}
        <div className="flex items-center justify-between p-4 bg-[#FFF1E0] border border-[#FFE5CC] rounded-xl">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#F97316]" />
            <div>
              <span className="text-[10px] text-[#8C7560] uppercase font-bold tracking-wider block">Shipment Reference</span>
              <span className="font-mono font-bold text-sm text-[#1C1009]">{refId}</span>
            </div>
          </div>
          <span className="text-[10px] bg-[#F97316] text-white px-2.5 py-1 rounded-full font-bold uppercase">Auto-Generated</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>{lbl(<><MapPin className="w-3.5 h-3.5 text-[#F97316]"/>Origin <span className="text-[#F97316]">*</span></>)}
            <input required className={inp} placeholder="Mumbai Port, India" value={form.origin} onChange={e=>set('origin',e.target.value)}/></div>

          <div>{lbl(<><MapPin className="w-3.5 h-3.5 text-[#F97316]"/>Destination <span className="text-[#F97316]">*</span></>)}
            <input required className={inp} placeholder="Hamburg Terminal, Germany" value={form.destination} onChange={e=>set('destination',e.target.value)}/></div>

          <div>{lbl(<><Truck className="w-3.5 h-3.5 text-[#F97316]"/>Mode <span className="text-[#F97316]">*</span></>)}
            <select className={inp} value={form.mode} onChange={e=>set('mode',e.target.value)}>
              <option value="Air">Air Freight</option>
              <option value="Sea">Sea Freight</option>
              <option value="Road">Road Logistics</option>
              <option value="Multimodal">Multimodal</option>
            </select></div>

          <div>{lbl(<><Building2 className="w-3.5 h-3.5 text-[#F97316]"/>Cargo Type <span className="text-[#F97316]">*</span></>)}
            <select className={inp} value={form.cargoType} onChange={e=>set('cargoType',e.target.value)}>
              <option value="General">General Merchandise</option>
              <option value="Fragile">Fragile / Sensitive</option>
              <option value="Hazardous">Hazardous (HAZMAT)</option>
              <option value="Perishable">Perishable / Cold Chain</option>
              <option value="Overdimensional">Overdimensional</option>
            </select></div>

          <div>{lbl(<><Scale className="w-3.5 h-3.5 text-[#F97316]"/>Weight (kg) <span className="text-[#F97316]">*</span></>)}
            <input required type="number" min="1" className={inp} placeholder="1500" value={form.weight} onChange={e=>set('weight',e.target.value)}/></div>

          <div>{lbl(<><Layers className="w-3.5 h-3.5 text-[#F97316]"/>Dimensions (L×W×H cm) <span className="text-[#F97316]">*</span></>)}
            <input required className={inp} placeholder="120 x 80 x 160 cm" value={form.dimensions} onChange={e=>set('dimensions',e.target.value)}/></div>

          <div>{lbl(<><DollarSign className="w-3.5 h-3.5 text-[#F97316]"/>Declared Value (USD)</>)}
            <input type="number" min="0" className={inp} placeholder="50000" value={form.declaredValue} onChange={e=>set('declaredValue',e.target.value)}/></div>

          <div>{lbl(<><Building2 className="w-3.5 h-3.5 text-[#F97316]"/>Incoterms <span className="text-[#F97316]">*</span></>)}
            <select className={inp} value={form.incoterms} onChange={e=>set('incoterms',e.target.value)}>
              <option value="EXW">EXW – Ex Works</option>
              <option value="FOB">FOB – Free On Board</option>
              <option value="CIF">CIF – Cost Insurance & Freight</option>
              <option value="DDP">DDP – Delivered Duty Paid</option>
              <option value="FCA">FCA – Free Carrier</option>
            </select></div>

          <div>{lbl(<><Calendar className="w-3.5 h-3.5 text-[#F97316]"/>Cargo Ready Date <span className="text-[#F97316]">*</span></>)}
            <input required type="date" className={inp} value={form.readyDate} onChange={e=>set('readyDate',e.target.value)}/></div>

          <div>{lbl(<><Clock className="w-3.5 h-3.5 text-[#F97316]"/>Bid Deadline <span className="text-[#F97316]">*</span></>)}
            <input required type="date" className={inp} value={form.deadline} onChange={e=>set('deadline',e.target.value)}/></div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1009] mb-2">Special Instructions</label>
          <textarea rows={3} className={inp} placeholder="Temperature requirements, stacking restrictions, priority handling…" value={form.specialInstructions} onChange={e=>set('specialInstructions',e.target.value)} />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#FFE5CC]">
          <p className="text-xs text-[#8C7560] font-semibold">
            Will email <span className="text-[#F97316] font-bold text-sm">{fwdCount}</span> registered agencies.
          </p>
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-60">
            {submitting
              ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Sending…</>
              : <><Send className="w-4 h-4"/> Dispatch Bids</>}
          </button>
        </div>
      </form>
    </div>
  );
}
