import React, { useState, useEffect } from 'react';
import { Building2, Search, Plus, Edit3, Trash2, Mail, Clock } from 'lucide-react';
import { getForwarders, addForwarder, updateForwarder, deleteForwarder } from '../storage.js';

function ForwarderModal({ editing, onClose, onSaved }) {
  const [form, setForm] = useState(
    editing || { name: '', company: '', email: '', phone: '', notes: '' }
  );
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) updateForwarder(editing.id, form);
    else addForwarder(form);
    onSaved();
    onClose();
  };

  const inp = "w-full p-3 bg-[#FFFBF5] border border-[#FFE5CC] rounded-xl text-sm text-[#1C1009] focus:ring-2 focus:ring-[#F97316]/30 focus:border-[#F97316] focus:outline-none transition-all";
  const lbl = "block text-xs font-bold uppercase tracking-wider text-[#1C1009] mb-2";

  return (
    <div className="fixed inset-0 bg-[#1C1009]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#FFE5CC] w-full max-w-lg shadow-xl overflow-hidden">
        <div className="bg-[#F97316] px-8 py-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white m-0">{editing ? 'Edit Agency' : 'Register Forwarding Partner'}</h3>
          <button onClick={onClose} className="text-white font-bold text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Contact Person <span className="text-[#F97316]">*</span></label>
              <input required className={inp} placeholder="Sarah Connor" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Company <span className="text-[#F97316]">*</span></label>
              <input required className={inp} placeholder="Apex Shippers Ltd." value={form.company} onChange={e => set('company', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={lbl}>Bidding Email <span className="text-[#F97316]">*</span></label>
            <input required type="email" className={inp} placeholder="bids@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Phone (Optional)</label>
            <input className={inp} placeholder="+1-555-0198" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Notes (Optional)</label>
            <textarea rows={3} className={inp} placeholder="Specialities, regions, response speed..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2 border-t border-[#FFE5CC]">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold text-[#4B3A2A] bg-[#FFF8F0] border border-[#FFE5CC] hover:bg-[#FFF1E0] transition-all">Cancel</button>
            <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-[#F97316] hover:bg-[#EA580C] transition-all shadow-sm">{editing ? 'Save Changes' : 'Add Partner'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Forwarders({ showToast, openModal: externalOpen, onModalClosed }) {
  const [forwarders, setForwarders] = useState(getForwarders);
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);

  // Trigger modal from parent (Dashboard shortcut)
  useEffect(() => { if (externalOpen) { setEditing(null); setModal(true); onModalClosed?.(); } }, [externalOpen]);

  const refresh = () => setForwarders(getForwarders());

  const handleDelete = (id) => {
    if (!window.confirm('Remove this forwarder?')) return;
    deleteForwarder(id);
    refresh();
    showToast('Forwarder removed.');
  };

  const filtered = forwarders.filter(f =>
    [f.name, f.company, f.email].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {(modal || editing) && (
        <ForwarderModal editing={editing} onClose={() => { setModal(false); setEditing(null); }} onSaved={() => { refresh(); showToast(editing ? 'Forwarder updated!' : 'Forwarder added!'); }} />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1C1009]">Forwarder CRM Directory</h2>
          <p className="text-sm text-[#4B3A2A] mt-1">Manage your logistics partner network. All contacts receive bid emails on each quotation dispatch.</p>
        </div>
        <button onClick={() => { setEditing(null); setModal(true); }} className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm self-start">
          <Plus className="w-4 h-4" /> Add Forwarder
        </button>
      </div>

      <div className="bg-white border border-[#FFE5CC] rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-[#8C7560] shrink-0" />
        <input
          type="text" placeholder="Search by name, company or email…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-[#1C1009] placeholder:text-[#8C7560] focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[#FFE5CC] rounded-2xl p-16 text-center shadow-sm flex flex-col items-center">
          <Building2 className="w-14 h-14 text-[#FFE5CC] mb-4" />
          <h3 className="text-lg font-bold text-[#1C1009]">No agencies found</h3>
          <p className="text-sm text-[#8C7560] mt-1">Add forwarding partners to start dispatching bid campaigns.</p>
          <button onClick={() => { setEditing(null); setModal(true); }} className="mt-4 bg-[#F97316] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#EA580C] transition-all">Add First Agency</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(f => (
            <div key={f.id} className="bg-white border border-[#FFE5CC] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#F97316]/30 transition-all relative flex flex-col">
              <div className="absolute top-4 right-4 flex gap-1">
                <button onClick={() => { setEditing(f); setModal(true); }} className="p-2 text-[#8C7560] hover:text-[#F97316] hover:bg-[#FFF8F0] rounded-full transition-all"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(f.id)} className="p-2 text-[#8C7560] hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
              <span className="text-[10px] bg-[#FFF1E0] text-[#F97316] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider self-start mb-3">Logistics Partner</span>
              <h4 className="text-base font-bold text-[#1C1009] pr-16 leading-tight">{f.company}</h4>
              <p className="text-sm font-semibold text-[#4B3A2A] mt-0.5 mb-4">{f.name}</p>
              <div className="space-y-2 text-xs border-t border-[#FFE5CC] pt-4 flex-1">
                <div className="flex items-center gap-2 text-[#4B3A2A]"><Mail className="w-4 h-4 text-[#F97316] shrink-0" /><span className="truncate">{f.email}</span></div>
                {f.phone && <div className="flex items-center gap-2 text-[#4B3A2A]"><Clock className="w-4 h-4 text-[#F97316] shrink-0" /><span>{f.phone}</span></div>}
              </div>
              {f.notes && <div className="mt-4 p-3 bg-[#FFFBF5] rounded-xl border border-[#FFE5CC] text-xs text-[#4B3A2A] italic">"{f.notes}"</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
