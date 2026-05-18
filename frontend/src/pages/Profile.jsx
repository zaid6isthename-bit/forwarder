import React, { useState, useEffect } from 'react';
import { User, Building2, Mail, Shield, CheckCircle2, RefreshCw, Globe, MapPin, Phone, Database } from 'lucide-react';

export default function Profile({ showToast }) {
  const [profile, setProfile] = useState({
    companyName: 'Acme Procurement Logistics',
    contactPerson: 'Zaid Mohammed',
    contactEmail: 'zaid6isthename@gmail.com',
    phone: '+91 98765 43210',
    baseHub: 'Mumbai Port, India',
    currency: 'USD',
    defaultIncoterm: 'FCA',
    preferredMode: 'Sea Freight'
  });

  const [loading, setLoading] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState({ active: true, host: 'smtp.gmail.com', user: 'zaid6isthename@gmail.com' });

  useEffect(() => {
    const saved = localStorage.getItem('fb_company_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing profile storage:', e);
      }
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      localStorage.setItem('fb_company_profile', JSON.stringify(profile));
      // Dispatch storage event to notify header
      window.dispatchEvent(new Event('storage_profile_updated'));
      setLoading(false);
      showToast('Company profile settings saved successfully!', 'success');
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-[#FFE5CC] pb-5">
        <div>
          <h2 className="text-2xl font-bold text-[#1C1009] flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#F97316]" /> Company & System Profile
          </h2>
          <p className="text-xs text-[#8C7560] mt-1">Configure your corporate procurement identity and view SMTP mailserver health.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Organization Card & System Integration Info */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Org Summary Card */}
          <div className="bg-white border border-[#FFE5CC] rounded-2xl p-6 shadow-sm text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-[#FFF1E0] border border-[#FFE5CC] flex items-center justify-center text-[#F97316] mx-auto shadow-sm">
              <Building2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-bold text-[#1C1009] text-lg">{profile.companyName}</h3>
              <p className="text-xs text-[#8C7560] font-medium mt-1">{profile.baseHub}</p>
            </div>
            <div className="pt-2 flex justify-center">
              <span className="bg-[#FFF1E0] border border-[#FFE5CC] text-[#F97316] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Active Client Network
              </span>
            </div>
          </div>

          {/* System Connections Status */}
          <div className="bg-white border border-[#FFE5CC] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1009] border-b border-[#FFE5CC] pb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#F97316]" /> SMTP Gateway Telemetry
            </h4>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#8C7560]">Relay Status:</span>
                <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  <CheckCircle2 className="w-3 h-3 text-green-500" /> ACTIVE
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7560]">Server Host:</span>
                <span className="font-mono text-[#1C1009] font-semibold">{smtpStatus.host}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7560]">Outbound User:</span>
                <span className="font-mono text-[#1C1009] truncate max-w-[120px] font-semibold" title={smtpStatus.user}>
                  {smtpStatus.user}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7560]">Server Port:</span>
                <span className="font-mono text-[#1C1009] font-semibold">587</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings Form */}
        <div className="lg:col-span-2 bg-white border border-[#FFE5CC] rounded-2xl p-6 sm:p-8 shadow-sm">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#1C1009] border-b border-[#FFE5CC] pb-3.5 mb-6 flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#F97316]" /> Logistics Department Identity
          </h4>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8C7560] block">Company Name</label>
                <input 
                  type="text" 
                  value={profile.companyName}
                  onChange={e => setProfile({...profile, companyName: e.target.value})}
                  className="w-full bg-[#FFFBF5] border border-[#FFE5CC] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] rounded-xl px-4 py-3 text-sm font-bold text-[#1C1009] outline-none transition-all"
                  required
                />
              </div>

              {/* Contact Person */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8C7560] block">Contact Person</label>
                <input 
                  type="text" 
                  value={profile.contactPerson}
                  onChange={e => setProfile({...profile, contactPerson: e.target.value})}
                  className="w-full bg-[#FFFBF5] border border-[#FFE5CC] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] rounded-xl px-4 py-3 text-sm font-bold text-[#1C1009] outline-none transition-all"
                  required
                />
              </div>

              {/* Contact Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8C7560] block">Official Email Address</label>
                <input 
                  type="email" 
                  value={profile.contactEmail}
                  onChange={e => setProfile({...profile, contactEmail: e.target.value})}
                  className="w-full bg-[#FFFBF5] border border-[#FFE5CC] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] rounded-xl px-4 py-3 text-sm font-bold text-[#1C1009] outline-none transition-all"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8C7560] block">Phone Number</label>
                <input 
                  type="text" 
                  value={profile.phone}
                  onChange={e => setProfile({...profile, phone: e.target.value})}
                  className="w-full bg-[#FFFBF5] border border-[#FFE5CC] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] rounded-xl px-4 py-3 text-sm font-bold text-[#1C1009] outline-none transition-all"
                />
              </div>

              {/* Base Hub */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8C7560] block">Primary Logistics Hub</label>
                <input 
                  type="text" 
                  value={profile.baseHub}
                  onChange={e => setProfile({...profile, baseHub: e.target.value})}
                  className="w-full bg-[#FFFBF5] border border-[#FFE5CC] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] rounded-xl px-4 py-3 text-sm font-bold text-[#1C1009] outline-none transition-all"
                />
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8C7560] block">Preferred Currency</label>
                <select 
                  value={profile.currency}
                  onChange={e => setProfile({...profile, currency: e.target.value})}
                  className="w-full bg-[#FFFBF5] border border-[#FFE5CC] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] rounded-xl px-4 py-3 text-sm font-bold text-[#1C1009] outline-none transition-all"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              {/* Default Incoterms */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8C7560] block">Default Incoterms</label>
                <select 
                  value={profile.defaultIncoterm}
                  onChange={e => setProfile({...profile, defaultIncoterm: e.target.value})}
                  className="w-full bg-[#FFFBF5] border border-[#FFE5CC] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] rounded-xl px-4 py-3 text-sm font-bold text-[#1C1009] outline-none transition-all"
                >
                  <option value="EXW">EXW · Ex Works</option>
                  <option value="FCA">FCA · Free Carrier</option>
                  <option value="FOB">FOB · Free On Board</option>
                  <option value="CIF">CIF · Cost, Insurance & Freight</option>
                  <option value="DDP">DDP · Delivered Duty Paid</option>
                </select>
              </div>

              {/* Preferred Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8C7560] block">Preferred Mode</label>
                <select 
                  value={profile.preferredMode}
                  onChange={e => setProfile({...profile, preferredMode: e.target.value})}
                  className="w-full bg-[#FFFBF5] border border-[#FFE5CC] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] rounded-xl px-4 py-3 text-sm font-bold text-[#1C1009] outline-none transition-all"
                >
                  <option value="Air Freight">Air Freight</option>
                  <option value="Sea Freight">Sea Freight</option>
                  <option value="Road Cargo">Road Cargo</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#FFE5CC]">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-[#F97316] hover:bg-[#EA580C] text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 min-w-[140px]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
