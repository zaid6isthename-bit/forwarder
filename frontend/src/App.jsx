import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Mail, 
  Trash2, 
  Edit3, 
  Search, 
  FileText, 
  Send, 
  CheckCircle2, 
  MapPin, 
  Scale, 
  Calendar, 
  DollarSign, 
  Boxes, 
  Truck, 
  AlertCircle, 
  Layers, 
  Clock, 
  User, 
  Clipboard, 
  Check, 
  FileDown, 
  Activity, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

const API_BASE = '/api';

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [forwarders, setForwarders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  
  // UI States
  const [backendOnline, setBackendOnline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fwdSearchQuery, setFwdSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);
  
  // Forwarder Modal / Edit States
  const [fwdModalOpen, setFwdModalOpen] = useState(false);
  const [editingFwd, setEditingFwd] = useState(null);
  const [fwdForm, setFwdForm] = useState({ name: '', company: '', email: '', phone: '', notes: '' });

  // Quote Form State
  const [quoteForm, setQuoteForm] = useState({
    origin: '',
    destination: '',
    cargoType: 'General',
    weight: '',
    dimensions: '',
    declaredValue: '',
    incoterms: 'EXW',
    mode: 'Air',
    readyDate: '',
    specialInstructions: '',
    deadline: ''
  });
  
  // New Quote Action States
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [createdQuoteSummary, setCreatedQuoteSummary] = useState(null);
  const [isEmailSending, setIsEmailSending] = useState(false);
  
  // Quote Detail Slide-over / Modal State
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [copiedQuoteId, setCopiedQuoteId] = useState(null);
  
  // Auto-generate Reference ID Helper
  const getNewRefId = () => {
    const today = new Date();
    const dateStr = today.getFullYear() + 
                    String(today.getMonth() + 1).padStart(2, '0') + 
                    String(today.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `FB-${dateStr}-${rand}`;
  };

  const [currentRefId, setCurrentRefId] = useState('');

  // Trigger temporary toast alerts
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      // Test backend connection
      const fwdRes = await fetch(`${API_BASE}/forwarders`);
      if (fwdRes.ok) {
        const fwdData = await fwdRes.json();
        setForwarders(fwdData);
        setBackendOnline(true);
        
        const qRes = await fetch(`${API_BASE}/quotes`);
        if (qRes.ok) {
          const qData = await qRes.json();
          setQuotes(qData);
        }
      }
    } catch (err) {
      console.warn('Backend offline, loading local localStorage fallbacks.');
      setBackendOnline(false);
      
      // Fallback Seed Data
      const cachedFwds = localStorage.getItem('fb_forwarders');
      if (cachedFwds) {
        setForwarders(JSON.parse(cachedFwds));
      } else {
        const defaultFwds = [
          { id: 'fwd-1', name: 'Alex Mercer', company: 'Global Cargo Solutions', email: 'alex.mercer@globalcargosolutions.example.com', phone: '+1-555-0198', notes: 'Excellent air freight rates. Quick responses.' },
          { id: 'fwd-2', name: 'Sarah Connor', company: 'Apex Shippers', email: 'sconnor@apexshippers.example.com', phone: '+44-20-7946-0958', notes: 'Specializes in European sea cargo and DDP incoterms.' },
          { id: 'fwd-3', name: 'Vikram Singh', company: 'Indo-Pacific Logistics', email: 'operations@indopacificlogistics.example.com', phone: '+91-22-5550-1234', notes: 'Reliable road transport across India & customs clearance support.' }
        ];
        setForwarders(defaultFwds);
        localStorage.setItem('fb_forwarders', JSON.stringify(defaultFwds));
      }

      const cachedQuotes = localStorage.getItem('fb_quotes');
      if (cachedQuotes) {
        setQuotes(JSON.parse(cachedQuotes));
      } else {
        const defaultQuotes = [
          { id: 'quote-1', referenceId: 'FB-20260510-4821', origin: 'Mumbai, India', destination: 'Hamburg, Germany', cargoType: 'General', weight: 1250, dimensions: '120x80x160 cm', declaredValue: 45000, incoterms: 'FOB', mode: 'Sea', readyDate: '2026-06-01', specialInstructions: 'Standard pallets. Stackable cargo.', deadline: '2026-05-22', status: 'Sent', createdAt: '2026-05-10T14:22:15.000Z', forwardersEmailedCount: 3 },
          { id: 'quote-2', referenceId: 'FB-20260514-9912', origin: 'Chicago, USA', destination: 'Tokyo, Japan', cargoType: 'Fragile', weight: 180, dimensions: '80x60x90 cm', declaredValue: 12000, incoterms: 'EXW', mode: 'Air', readyDate: '2026-05-28', specialInstructions: 'Delicate lab equipment. Do not stack.', deadline: '2026-05-20', status: 'Sent', createdAt: '2026-05-14T09:15:30.000Z', forwardersEmailedCount: 3 }
        ];
        setQuotes(defaultQuotes);
        localStorage.setItem('fb_quotes', JSON.stringify(defaultQuotes));
      }
    }
  };

  useEffect(() => {
    fetchData();
    setCurrentRefId(getNewRefId());
    
    // Periodically poll backend status
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/forwarders`);
        if (res.ok) setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // ==================== FORWARDER ACTIONS ====================
  
  const handleOpenFwdModal = (fwd = null) => {
    if (fwd) {
      setEditingFwd(fwd);
      setFwdForm({ name: fwd.name, company: fwd.company, email: fwd.email, phone: fwd.phone, notes: fwd.notes });
    } else {
      setEditingFwd(null);
      setFwdForm({ name: '', company: '', email: '', phone: '', notes: '' });
    }
    setFwdModalOpen(true);
  };

  const handleSaveForwarder = async (e) => {
    e.preventDefault();
    if (!fwdForm.name || !fwdForm.company || !fwdForm.email) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    try {
      if (backendOnline) {
        let res;
        if (editingFwd) {
          res = await fetch(`${API_BASE}/forwarders/${editingFwd.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fwdForm)
          });
        } else {
          res = await fetch(`${API_BASE}/forwarders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fwdForm)
          });
        }

        if (res.ok) {
          showToast(editingFwd ? 'Forwarder updated successfully!' : 'Forwarder added successfully!');
          fetchData();
          setFwdModalOpen(false);
        } else {
          showToast('Failed to save forwarder on the server.', 'error');
        }
      } else {
        // Local fallback
        let updatedFwds = [...forwarders];
        if (editingFwd) {
          updatedFwds = updatedFwds.map(f => f.id === editingFwd.id ? { ...f, ...fwdForm } : f);
        } else {
          const newF = { id: `fwd-${Date.now()}`, ...fwdForm };
          updatedFwds.push(newF);
        }
        setForwarders(updatedFwds);
        localStorage.setItem('fb_forwarders', JSON.stringify(updatedFwds));
        showToast(editingFwd ? 'Forwarder updated locally!' : 'Forwarder added locally!');
        setFwdModalOpen(false);
      }
    } catch (err) {
      showToast('An error occurred while saving.', 'error');
    }
  };

  const handleDeleteForwarder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this forwarder?')) return;

    try {
      if (backendOnline) {
        const res = await fetch(`${API_BASE}/forwarders/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Forwarder deleted successfully!');
          fetchData();
        } else {
          showToast('Failed to delete forwarder.', 'error');
        }
      } else {
        const updatedFwds = forwarders.filter(f => f.id !== id);
        setForwarders(updatedFwds);
        localStorage.setItem('fb_forwarders', JSON.stringify(updatedFwds));
        showToast('Forwarder deleted locally!');
      }
    } catch (err) {
      showToast('Failed to delete.', 'error');
    }
  };

  // ==================== QUOTE ACTIONS ====================

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    if (!quoteForm.origin || !quoteForm.destination || !quoteForm.cargoType) {
      showToast('Origin, Destination, and Cargo Type are required.', 'error');
      return;
    }

    if (forwarders.length === 0) {
      showToast('Please add at least one forwarder in directory before dispatching bids.', 'error');
      return;
    }

    setIsSubmittingQuote(true);

    try {
      const finalQuoteData = { ...quoteForm, referenceId: currentRefId };
      
      let savedQuote = null;

      if (backendOnline) {
        const res = await fetch(`${API_BASE}/quotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalQuoteData)
        });

        if (res.ok) {
          savedQuote = await res.json();
          fetchData();
        } else {
          showToast('Server failed to save quotation.', 'error');
          setIsSubmittingQuote(false);
          return;
        }
      } else {
        // Local save
        savedQuote = {
          id: `quote-${Date.now()}`,
          ...finalQuoteData,
          weight: Number(finalQuoteData.weight) || 0,
          declaredValue: Number(finalQuoteData.declaredValue) || 0,
          status: 'Pending',
          createdAt: new Date().toISOString(),
          forwardersEmailedCount: 0
        };

        const updatedQuotes = [savedQuote, ...quotes];
        setQuotes(updatedQuotes);
        localStorage.setItem('fb_quotes', JSON.stringify(updatedQuotes));
      }

      setCreatedQuoteSummary(savedQuote);
      showToast('Quotation saved successfully!');
      
      // Auto trigger SMTP dispatch
      setIsEmailSending(true);
      
      if (backendOnline) {
        const emailRes = await fetch(`${API_BASE}/send-quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteId: savedQuote.id })
        });

        if (emailRes.ok) {
          const emailData = await emailRes.json();
          if (emailData.isMock) {
            showToast('SMTP in Mock Mode: Emails printed to backend terminal!', 'info');
          } else {
            showToast(`Inquiry dispatched to ${emailData.sentCount} forwarders!`);
          }
          fetchData();
        } else {
          showToast('Failed to dispatch automated SMTP emails.', 'warning');
        }
      } else {
        // Local simulated send-out after 1.5s
        await new Promise(resolve => setTimeout(resolve, 1500));
        const updatedQuotes = quotes.map(q => 
          q.id === savedQuote.id || (savedQuote.id && q.id === savedQuote.id)
            ? { ...q, status: 'Sent', forwardersEmailedCount: forwarders.length } 
            : q
        );
        
        // Update local quote instance
        savedQuote.status = 'Sent';
        savedQuote.forwardersEmailedCount = forwarders.length;

        // Save again
        const reCachedQuotes = quotes.map(q => q.id === savedQuote.id ? savedQuote : q);
        if (!quotes.some(q => q.id === savedQuote.id)) {
          reCachedQuotes.unshift(savedQuote);
        }
        setQuotes(reCachedQuotes);
        localStorage.setItem('fb_quotes', JSON.stringify(reCachedQuotes));
        showToast(`Offline mode: Simulated bid dispatch sent to ${forwarders.length} forwarders!`);
      }

      setIsEmailSending(false);
      setIsSubmittingQuote(false);
      setShowSuccessScreen(true);
      
      // Clear form & generate new Reference ID
      setQuoteForm({
        origin: '',
        destination: '',
        cargoType: 'General',
        weight: '',
        dimensions: '',
        declaredValue: '',
        incoterms: 'EXW',
        mode: 'Air',
        readyDate: '',
        specialInstructions: '',
        deadline: ''
      });
      setCurrentRefId(getNewRefId());

    } catch (err) {
      console.error(err);
      showToast('Error during dispatching quote.', 'error');
      setIsSubmittingQuote(false);
      setIsEmailSending(false);
    }
  };

  const triggerManualEmailSend = async (quote) => {
    if (forwarders.length === 0) {
      showToast('Please add forwarders to your database first.', 'error');
      return;
    }
    
    showToast('Triggering email campaign...');
    
    try {
      if (backendOnline) {
        const emailRes = await fetch(`${API_BASE}/send-quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteId: quote.id })
        });
        
        if (emailRes.ok) {
          const data = await emailRes.json();
          showToast(data.isMock ? 'Mock emails dispatched (printed in backend console)!' : `Successfully sent bids to ${data.sentCount} forwarders!`);
          fetchData();
          if (selectedQuote && selectedQuote.id === quote.id) {
            setSelectedQuote({ ...selectedQuote, status: 'Sent', forwardersEmailedCount: data.sentCount });
          }
        } else {
          showToast('Failed to dispatch email from server.', 'error');
        }
      } else {
        // Local simulation
        const updated = quotes.map(q => q.id === quote.id ? { ...q, status: 'Sent', forwardersEmailedCount: forwarders.length } : q);
        setQuotes(updated);
        localStorage.setItem('fb_quotes', JSON.stringify(updated));
        showToast(`Simulated emails sent offline to ${forwarders.length} contacts!`);
        if (selectedQuote && selectedQuote.id === quote.id) {
          setSelectedQuote({ ...selectedQuote, status: 'Sent', forwardersEmailedCount: forwarders.length });
        }
      }
    } catch (err) {
      showToast('Connection error during email trigger.', 'error');
    }
  };

  // ==================== EXTRA PREMIUM SERVICES ====================

  const copyEmailTemplateToClipboard = (quote, forwarderName = '[Forwarder Name]', company = '[Forwarder Company]') => {
    const rawTemplate = `Subject: Freight Quotation Request – ${quote.referenceId} | ${quote.origin} to ${quote.destination}

Dear ${forwarderName},

We have a new shipment quotation request and would like to invite you to submit your best offer.

SHIPMENT DETAILS:
- Reference ID: ${quote.referenceId}
- Origin: ${quote.origin}
- Destination: ${quote.destination}
- Cargo Type: ${quote.cargoType}
- Weight: ${quote.weight} kg
- Dimensions: ${quote.dimensions || 'N/A'}
- Declared Value: $${quote.declaredValue ? Number(quote.declaredValue).toLocaleString() : 'N/A'}
- Incoterms: ${quote.incoterms}
- Mode: ${quote.mode}
- Ready Date: ${quote.readyDate || 'ASAP'}
- Special Instructions: ${quote.specialInstructions || 'None'}

Please reply to this email with:
1. Your quoted price (total, in USD or INR)
2. Estimated transit time
3. Any additional conditions or remarks

Response Deadline: ${quote.deadline ? new Date(quote.deadline).toLocaleDateString() : 'ASAP'}

Thank you,
Logistics Team
FreightBid Platform`;

    navigator.clipboard.writeText(rawTemplate);
    setCopiedQuoteId(quote.id);
    showToast('Formatted email template copied to clipboard!');
    setTimeout(() => setCopiedQuoteId(null), 3000);
  };

  const handlePrintQuotePDF = (quote) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Shipment Quotation - ${quote.referenceId}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1C1009; line-height: 1.5; background: #fff; }
            .header-bar { border-bottom: 3px solid #F97316; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 28px; font-weight: bold; color: #F97316; }
            .title { font-size: 16px; color: #8C7560; font-weight: 500; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
            .info-card { background: #FFFBF5; border: 1px solid #FFE5CC; border-radius: 8px; padding: 15px; }
            .info-card h3 { color: #F97316; margin-top: 0; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td { padding: 12px; border-bottom: 1px solid #FFE5CC; font-size: 14px; }
            td.label { font-weight: bold; color: #4B3A2A; width: 35%; background-color: #FFFBF5; }
            td.val { color: #1C1009; }
            .instructions { margin-top: 30px; padding: 15px; background: #FFF8F0; border-radius: 8px; border-left: 4px solid #F97316; }
            .footer { margin-top: 50px; font-size: 11px; text-align: center; color: #8C7560; border-top: 1px solid #FFE5CC; padding-top: 20px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <div class="logo">FreightBid</div>
              <div class="title">Logistics Dispatch Center</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #1C1009; font-size: 20px;">QUOTATION REQUEST</h2>
              <div style="font-size: 14px; font-weight: bold; color: #F97316;">${quote.referenceId}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <h3>Route Summary</h3>
              <p><strong>Origin:</strong> ${quote.origin}</p>
              <p><strong>Destination:</strong> ${quote.destination}</p>
              <p><strong>Shipment Method:</strong> ${quote.mode}</p>
            </div>
            <div class="info-card">
              <h3>Metadata</h3>
              <p><strong>Created On:</strong> ${new Date(quote.createdAt).toLocaleDateString()}</p>
              <p><strong>Response Deadline:</strong> ${quote.deadline ? new Date(quote.deadline).toLocaleDateString() : 'Immediate'}</p>
              <p><strong>Active Status:</strong> ${quote.status}</p>
            </div>
          </div>

          <h3>SHIPMENT SPECIFICATIONS</h3>
          <table>
            <tr>
              <td class="label">Cargo Category</td>
              <td class="val">${quote.cargoType}</td>
            </tr>
            <tr>
              <td class="label">Gross Weight</td>
              <td class="val">${quote.weight} kg</td>
            </tr>
            <tr>
              <td class="label">Dimensions (L x W x H)</td>
              <td class="val">${quote.dimensions || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Declared Valuation</td>
              <td class="val">${quote.declaredValue ? `$${quote.declaredValue.toLocaleString()}` : 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Incoterm Classification</td>
              <td class="val">${quote.incoterms}</td>
            </tr>
            <tr>
              <td class="label">Cargo Readiness Date</td>
              <td class="val">${quote.readyDate || 'Immediate'}</td>
            </tr>
          </table>

          ${quote.specialInstructions ? `
            <div class="instructions">
              <strong style="color: #F97316; font-size: 13px; text-transform: uppercase;">Special Handling Directives:</strong>
              <p style="margin-top: 5px; margin-bottom: 0; font-size: 13px;">${quote.specialInstructions}</p>
            </div>
          ` : ''}

          <div class="footer">
            Generated automatically via the FreightBid Premium Shippers Hub.<br/>
            &copy; ${new Date().getFullYear()} FreightBid Inc. Certified Shipment Document.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered Lists
  const filteredForwarders = forwarders.filter(f => 
    f.name.toLowerCase().includes(fwdSearchQuery.toLowerCase()) ||
    f.company.toLowerCase().includes(fwdSearchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(fwdSearchQuery.toLowerCase())
  );

  const filteredQuotes = quotes.filter(q => 
    q.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.cargoType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-cream flex">
      {/* ==================== SIDEBAR ==================== */}
      <aside className="w-72 bg-brand-surface border-r border-brand-divider flex flex-col shrink-0">
        <div className="p-8 border-b border-brand-divider flex items-center gap-3">
          <div className="w-10 h-10 rounded-inner bg-brand-orange flex items-center justify-center shadow-orange-glow">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-textHead m-0">FreightBid</h1>
            <p className="text-xs text-brand-textMuted font-medium leading-none mt-1">Logistics Controller</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => { setActiveTab('dashboard'); setShowSuccessScreen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-inner font-medium text-sm transition-all duration-200 ${
              activeTab === 'dashboard' 
                ? 'bg-brand-creamDark text-brand-orange shadow-sm font-semibold' 
                : 'text-brand-textBody hover:bg-brand-cream/50 hover:text-brand-orange'
            }`}
          >
            <Activity className="w-5 h-5 shrink-0" />
            Control Center
          </button>

          <button 
            onClick={() => { setActiveTab('forwarders'); setShowSuccessScreen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-inner font-medium text-sm transition-all duration-200 ${
              activeTab === 'forwarders' 
                ? 'bg-brand-creamDark text-brand-orange shadow-sm font-semibold' 
                : 'text-brand-textBody hover:bg-brand-cream/50 hover:text-brand-orange'
            }`}
          >
            <Building2 className="w-5 h-5 shrink-0" />
            Forwarder CRM
            <span className="ml-auto bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full text-xs font-bold">
              {forwarders.length}
            </span>
          </button>

          <button 
            onClick={() => { setActiveTab('new-quote'); setShowSuccessScreen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-inner font-medium text-sm transition-all duration-200 ${
              activeTab === 'new-quote' 
                ? 'bg-brand-creamDark text-brand-orange shadow-sm font-semibold' 
                : 'text-brand-textBody hover:bg-brand-cream/50 hover:text-brand-orange'
            }`}
          >
            <Plus className="w-5 h-5 shrink-0" />
            Dispatch Shipment
          </button>

          <button 
            onClick={() => { setActiveTab('quotes'); setShowSuccessScreen(false); }}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-inner font-medium text-sm transition-all duration-200 ${
              activeTab === 'quotes' 
                ? 'bg-brand-creamDark text-brand-orange shadow-sm font-semibold' 
                : 'text-brand-textBody hover:bg-brand-cream/50 hover:text-brand-orange'
            }`}
          >
            <FileText className="w-5 h-5 shrink-0" />
            Quotation History
            <span className="ml-auto bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full text-xs font-bold">
              {quotes.length}
            </span>
          </button>
        </nav>

        {/* Status widget in sidebar */}
        <div className="p-4 m-4 bg-brand-creamLight border border-brand-divider rounded-card flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {backendOnline ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600">API Connection Active</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-600">Local Sandbox Mode</span>
              </>
            )}
          </div>
          <p className="text-[10px] text-brand-textMuted leading-relaxed">
            {backendOnline 
              ? 'Connected to local SMTP Express server at port 5000.' 
              : 'Server offline. All changes are securely isolated in sandbox memory.'}
          </p>
        </div>
      </aside>

      {/* ==================== MAIN PAGE WRAPPER ==================== */}
      <main className="flex-1 flex flex-col overflow-y-auto max-h-screen">
        {/* ==================== TOP NAV BAR ==================== */}
        <header className="h-20 bg-brand-surface border-b border-brand-divider flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs bg-brand-orange/10 text-brand-orange font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              Main Network
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Quick Stats shortcut */}
            <div className="hidden md:flex items-center gap-6 border-r border-brand-divider pr-6 text-sm">
              <div>
                <span className="text-brand-textMuted text-xs font-medium block">Total Dispatched</span>
                <span className="text-brand-textHead font-bold">{quotes.filter(q => q.status === 'Sent').length} Bids</span>
              </div>
              <div>
                <span className="text-brand-textMuted text-xs font-medium block">Forwarders Online</span>
                <span className="text-brand-textHead font-bold">{forwarders.length} Agencies</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-creamDark border border-brand-orange/20 flex items-center justify-center text-brand-orange">
                <User className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm text-brand-textHead">Logistics Manager</span>
            </div>
          </div>
        </header>

        {/* Toast Alert */}
        {notification && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-inner shadow-brand border text-sm transition-all duration-300 animate-slide-up ${
            notification.type === 'error' 
              ? 'bg-rose-50 border-rose-200 text-rose-800' 
              : notification.type === 'info'
              ? 'bg-sky-50 border-sky-200 text-sky-800'
              : notification.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-orange-50 border-brand-divider text-brand-textHead'
          }`}>
            <AlertCircle className={`w-5 h-5 shrink-0 ${notification.type === 'error' ? 'text-rose-500' : notification.type === 'info' ? 'text-sky-500' : 'text-brand-orange'}`} />
            <p className="font-medium">{notification.message}</p>
          </div>
        )}

        {/* ==================== TAB VIEWPORT ==================== */}
        <div className="flex-1 p-10 bg-brand-cream/35">
          
          {/* ==================== TAB 1: DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              {/* Header block */}
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-brand-textHead">Shipment Dispatch Control Room</h2>
                <p className="text-brand-textBody font-medium text-sm">Monitor instant delivery operations, dispatch inquiries to listed partners, and copy bidding credentials.</p>
              </div>

              {/* Stats Widgets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-brand-surface border border-brand-divider rounded-card p-6 shadow-brand hover:shadow-brand-hover transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-300"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-brand-textMuted text-xs font-semibold uppercase tracking-wider block">Campaign Dispatch</span>
                    <div className="p-2.5 rounded-inner bg-brand-orange/10 text-brand-orange">
                      <Send className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-brand-textHead block mb-1">
                    {quotes.filter(q => q.status === 'Sent').length}
                  </span>
                  <span className="text-xs text-brand-textMuted font-medium">Active quotation requests emailed</span>
                </div>

                <div className="bg-brand-surface border border-brand-divider rounded-card p-6 shadow-brand hover:shadow-brand-hover transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-300"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-brand-textMuted text-xs font-semibold uppercase tracking-wider block">Forwarder Network</span>
                    <div className="p-2.5 rounded-inner bg-amber-100 text-brand-orange">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-brand-textHead block mb-1">{forwarders.length}</span>
                  <span className="text-xs text-brand-textMuted font-medium">Bidders registered in CRM</span>
                </div>

                <div className="bg-brand-surface border border-brand-divider rounded-card p-6 shadow-brand hover:shadow-brand-hover transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-300"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-brand-textMuted text-xs font-semibold uppercase tracking-wider block">Pending Actions</span>
                    <div className="p-2.5 rounded-inner bg-emerald-50 text-emerald-600">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-brand-textHead block mb-1">
                    {quotes.filter(q => q.status === 'Pending').length}
                  </span>
                  <span className="text-xs text-brand-textMuted font-medium">Draft quotes pending dispatch</span>
                </div>

                <div className="bg-brand-surface border border-brand-divider rounded-card p-6 shadow-brand hover:shadow-brand-hover transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-300"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-brand-textMuted text-xs font-semibold uppercase tracking-wider block">Automated Dispatches</span>
                    <div className="p-2.5 rounded-inner bg-rose-50 text-rose-500">
                      <Mail className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-brand-textHead block mb-1">
                    {quotes.reduce((acc, q) => acc + (q.forwardersEmailedCount || 0), 0)}
                  </span>
                  <span className="text-xs text-brand-textMuted font-medium">Individual bid notifications sent</span>
                </div>
              </div>

              {/* Grid 2 Columns: Main Flow */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Recent Activities */}
                <div className="bg-brand-surface border border-brand-divider rounded-card p-8 shadow-brand lg:col-span-2">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-brand-divider">
                    <h3 className="text-lg font-bold text-brand-textHead">Recent Shipments & Campaigns</h3>
                    <button 
                      onClick={() => setActiveTab('quotes')}
                      className="text-xs text-brand-orange hover:text-brand-orangeDark font-bold flex items-center gap-1.5"
                    >
                      Browse All Operations &rarr;
                    </button>
                  </div>

                  {quotes.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center">
                      <FileText className="w-12 h-12 text-brand-divider mb-3" />
                      <p className="text-sm font-semibold text-brand-textMuted">No quotation history recorded yet.</p>
                      <button 
                        onClick={() => setActiveTab('new-quote')}
                        className="mt-3 text-xs bg-brand-orange text-white px-4 py-2 rounded-inner hover:bg-brand-orangeDark font-bold transition-all"
                      >
                        Submit First Cargo Dispatch
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quotes.slice(0, 4).map((q) => (
                        <div key={q.id} className="p-4 bg-brand-creamLight hover:bg-brand-cream/50 rounded-inner border border-brand-divider transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 shrink-0 bg-brand-surface border border-brand-divider rounded-full flex items-center justify-center text-brand-orange">
                              <Truck className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-brand-textHead">{q.referenceId}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  q.status === 'Sent' ? 'bg-orange-100 text-brand-orange' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {q.status}
                                </span>
                              </div>
                              <p className="text-xs text-brand-textBody mt-1 font-medium">
                                <span className="font-bold">{q.origin}</span> to <span className="font-bold">{q.destination}</span>
                              </p>
                              <span className="text-[10px] text-brand-textMuted block mt-0.5">
                                {q.mode} • {q.cargoType} • {q.weight} kg
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end md:self-auto">
                            <span className="text-xs font-semibold text-brand-textMuted shrink-0">
                              {new Date(q.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            
                            <button
                              onClick={() => { setSelectedQuote(q); setActiveTab('quotes'); }}
                              className="text-xs bg-brand-surface hover:bg-brand-creamDark text-brand-textHead px-3 py-1.5 rounded-inner border border-brand-divider font-semibold transition-all shrink-0"
                            >
                              Details
                            </button>
                            
                            {q.status === 'Pending' && (
                              <button
                                onClick={() => triggerManualEmailSend(q)}
                                className="text-xs bg-brand-orange hover:bg-brand-orangeDark text-white px-3 py-1.5 rounded-inner font-semibold transition-all shrink-0 flex items-center gap-1 shadow-sm"
                              >
                                <Send className="w-3 h-3" /> Send
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sidebar Widget: Shortcuts */}
                <div className="space-y-6">
                  
                  {/* Partner Quick Add */}
                  <div className="bg-brand-surface border border-brand-divider rounded-card p-6 shadow-brand">
                    <h3 className="text-base font-bold text-brand-textHead mb-1">Logistics CRM Shortcuts</h3>
                    <p className="text-xs text-brand-textMuted font-medium mb-4">Quickly initialize cargo or update contacts.</p>
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleOpenFwdModal()}
                        className="w-full flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orangeDark text-white py-2.5 rounded-inner text-sm font-semibold transition-all shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Add New Forwarder
                      </button>
                      <button 
                        onClick={() => setActiveTab('new-quote')}
                        className="w-full flex items-center justify-center gap-2 bg-brand-creamDark hover:bg-brand-cream text-brand-orange py-2.5 rounded-inner text-sm font-semibold border border-brand-divider transition-all"
                      >
                        <Send className="w-4 h-4" /> Dispatch Shipment Quotation
                      </button>
                    </div>
                  </div>

                  {/* Forwarder Quick Overview List */}
                  <div className="bg-brand-surface border border-brand-divider rounded-card p-6 shadow-brand">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-brand-divider">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-textHead">Registered Agencies</h3>
                      <span className="text-xs font-semibold text-brand-orange">{forwarders.length} Agencies</span>
                    </div>

                    {forwarders.length === 0 ? (
                      <p className="text-xs text-brand-textMuted text-center py-6">No partners in CRM.</p>
                    ) : (
                      <div className="space-y-3 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                        {forwarders.slice(0, 5).map((f) => (
                          <div key={f.id} className="flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-brand-textHead block">{f.company}</span>
                              <span className="text-[10px] text-brand-textMuted block">{f.name}</span>
                            </div>
                            <span className="text-[10px] bg-brand-cream px-2 py-0.5 rounded-full border border-brand-divider text-brand-textBody font-medium truncate max-w-[120px]">
                              {f.email}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================== TAB 2: FORWARDERS ==================== */}
          {activeTab === 'forwarders' && (
            <div className="space-y-8">
              
              {/* Header banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-bold tracking-tight text-brand-textHead">Forwarder CRM Directory</h2>
                  <p className="text-brand-textBody font-medium text-sm">Organize and manage the core logistics network of bidding agencies. Auto-synced with outbound campaigns.</p>
                </div>
                <button
                  onClick={() => handleOpenFwdModal()}
                  className="bg-brand-orange hover:bg-brand-orangeDark text-white px-5 py-3 rounded-inner font-bold text-sm transition-all shadow-sm flex items-center gap-2 self-start md:self-auto"
                >
                  <Plus className="w-5 h-5" /> Add Forwarder
                </button>
              </div>

              {/* Search Filters */}
              <div className="bg-brand-surface border border-brand-divider rounded-card p-4 shadow-brand flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-3 text-brand-textMuted w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search agencies by contact name, company name, or email..."
                    value={fwdSearchQuery}
                    onChange={(e) => setFwdSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead placeholder:text-brand-textMuted focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
                  />
                </div>
              </div>

              {/* Forwarders Directory list */}
              {filteredForwarders.length === 0 ? (
                <div className="bg-brand-surface border border-brand-divider rounded-card p-12 text-center flex flex-col items-center justify-center shadow-brand">
                  <Building2 className="w-16 h-16 text-brand-divider mb-4" />
                  <h3 className="text-lg font-bold text-brand-textHead">No agencies match your criteria.</h3>
                  <p className="text-brand-textMuted text-sm mt-1 max-w-sm">Enter shipping agents to construct a premium logistics bidding circle.</p>
                  <button 
                    onClick={() => handleOpenFwdModal()}
                    className="mt-4 bg-brand-orange text-white px-5 py-2.5 rounded-inner hover:bg-brand-orangeDark font-bold text-sm transition-all"
                  >
                    Add Your First Agency
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredForwarders.map((f) => (
                    <div 
                      key={f.id} 
                      className="bg-brand-surface border border-brand-divider rounded-card p-6 shadow-brand hover:shadow-brand-hover hover:border-brand-orange/40 transition-all duration-300 relative flex flex-col"
                    >
                      {/* Operations buttons top-right */}
                      <div className="absolute top-4 right-4 flex items-center gap-1">
                        <button
                          onClick={() => handleOpenFwdModal(f)}
                          className="p-2 text-brand-textMuted hover:text-brand-orange hover:bg-brand-cream rounded-full transition-all"
                          title="Edit CRM entry"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteForwarder(f.id)}
                          className="p-2 text-brand-textMuted hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
                          title="Remove CRM entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mb-4">
                        <span className="text-[10px] bg-brand-creamDark text-brand-orange px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                          Logistics Partner
                        </span>
                      </div>

                      <div className="space-y-1 mb-4 pr-12">
                        <h4 className="text-lg font-bold text-brand-textHead leading-tight truncate">{f.company}</h4>
                        <p className="text-sm font-semibold text-brand-textBody">{f.name}</p>
                      </div>

                      <div className="space-y-2 text-xs border-t border-brand-divider pt-4 flex-1">
                        <div className="flex items-center gap-2.5 text-brand-textBody font-medium">
                          <Mail className="w-4 h-4 text-brand-orange" />
                          <span className="truncate">{f.email}</span>
                        </div>
                        {f.phone && (
                          <div className="flex items-center gap-2.5 text-brand-textBody font-medium">
                            <Clock className="w-4 h-4 text-brand-orange" />
                            <span>{f.phone}</span>
                          </div>
                        )}
                      </div>

                      {f.notes && (
                        <div className="mt-4 p-3 bg-brand-creamLight rounded-inner border border-brand-divider text-xs text-brand-textBody italic">
                          "{f.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ==================== ADD/EDIT FORWARDER MODAL ==================== */}
              {fwdModalOpen && (
                <div className="fixed inset-0 bg-brand-textHead/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-brand-surface rounded-card border border-brand-divider w-full max-w-lg shadow-brand-hover overflow-hidden animate-zoom-in">
                    <div className="bg-brand-orange px-8 py-5 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white m-0">
                        {editingFwd ? 'Edit Forwarding Agency Details' : 'Register New Forwarding Partner'}
                      </h3>
                      <button 
                        onClick={() => setFwdModalOpen(false)}
                        className="text-white hover:text-brand-cream font-bold text-lg"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSaveForwarder} className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead mb-2">
                            Contact Person <span className="text-brand-orange">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Sarah Connor"
                            value={fwdForm.name}
                            onChange={(e) => setFwdForm({ ...fwdForm, name: e.target.value })}
                            className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                          />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead mb-2">
                            Company Name <span className="text-brand-orange">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Apex Shippers Ltd."
                            value={fwdForm.company}
                            onChange={(e) => setFwdForm({ ...fwdForm, company: e.target.value })}
                            className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead mb-2">
                          Outbound Bidding Email <span className="text-brand-orange">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. bids@apexshippers.com"
                          value={fwdForm.email}
                          onChange={(e) => setFwdForm({ ...fwdForm, email: e.target.value })}
                          className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead mb-2">
                          Direct Hotline / Phone (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. +1-555-0198"
                          value={fwdForm.phone}
                          onChange={(e) => setFwdForm({ ...fwdForm, phone: e.target.value })}
                          className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead mb-2">
                          Strategic Remarks / Notes (Optional)
                        </label>
                        <textarea
                          rows="3"
                          placeholder="Note down shipping specialities, operational regions, typical response metrics..."
                          value={fwdForm.notes}
                          onChange={(e) => setFwdForm({ ...fwdForm, notes: e.target.value })}
                          className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                        />
                      </div>

                      <div className="flex gap-4 pt-4 border-t border-brand-divider">
                        <button
                          type="button"
                          onClick={() => setFwdModalOpen(false)}
                          className="flex-1 bg-brand-cream hover:bg-brand-creamDark border border-brand-divider py-3.5 rounded-inner text-sm font-bold text-brand-textBody transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-brand-orange hover:bg-brand-orangeDark py-3.5 rounded-inner text-sm font-bold text-white transition-all shadow-sm"
                        >
                          {editingFwd ? 'Update Partner' : 'Confirm Registration'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==================== TAB 3: NEW QUOTE ==================== */}
          {activeTab === 'new-quote' && (
            <div className="max-w-4xl mx-auto space-y-8">
              
              {!showSuccessScreen ? (
                <>
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-bold tracking-tight text-brand-textHead">Dispatch Shipment Quotation Wizard</h2>
                    <p className="text-brand-textBody font-medium text-sm">Prepare logistics requirements. On submission, they will be registered in the system database and broadcast to the forwarder list immediately.</p>
                  </div>

                  <form onSubmit={handleCreateQuote} className="bg-brand-surface border border-brand-divider rounded-card p-8 shadow-brand space-y-8">
                    
                    {/* Header reference ID banner */}
                    <div className="p-4 bg-brand-creamDark border border-brand-divider rounded-inner flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-orange" />
                        <div>
                          <span className="text-[10px] text-brand-textMuted uppercase font-bold tracking-wider block">Shipment Reference Designation</span>
                          <span className="font-mono font-bold text-sm text-brand-textHead">{currentRefId}</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-brand-orange text-white px-2.5 py-1 rounded-full font-bold uppercase self-start sm:self-auto">
                        Auto-Generated Unique ID
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ORIGIN */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-brand-orange" /> Origin (City, Country) <span className="text-brand-orange">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Mumbai Port, India"
                          value={quoteForm.origin}
                          onChange={(e) => setQuoteForm({ ...quoteForm, origin: e.target.value })}
                          className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                        />
                      </div>

                      {/* DESTINATION */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-brand-orange" /> Destination (City, Country) <span className="text-brand-orange">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Hamburg Terminal, Germany"
                          value={quoteForm.destination}
                          onChange={(e) => setQuoteForm({ ...quoteForm, destination: e.target.value })}
                          className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                        />
                      </div>

                      {/* MODE OF SHIPMENT */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-brand-orange" /> Mode of Shipment <span className="text-brand-orange">*</span>
                        </label>
                        <select
                          value={quoteForm.mode}
                          onChange={(e) => setQuoteForm({ ...quoteForm, mode: e.target.value })}
                          className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                        >
                          <option value="Air">Air Freight (Priority Cargo)</option>
                          <option value="Sea">Sea Freight (Ocean Cargo)</option>
                          <option value="Road">Road Logistics (Truckload)</option>
                          <option value="Multimodal">Multimodal (Combined Express)</option>
                        </select>
                      </div>

                      {/* CARGO TYPE */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead flex items-center gap-1.5">
                          <Boxes className="w-4 h-4 text-brand-orange" /> Cargo Classification <span className="text-brand-orange">*</span>
                        </label>
                        <select
                          value={quoteForm.cargoType}
                          onChange={(e) => setQuoteForm({ ...quoteForm, cargoType: e.target.value })}
                          className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                        >
                          <option value="General">General Merchandise (Dry Load)</option>
                          <option value="Fragile">Fragile Electronics / Sensitive</option>
                          <option value="Hazardous">Hazardous Materials (HAZMAT)</option>
                          <option value="Perishable">Perishable Food / Cold Chain</option>
                          <option value="Overdimensional">Overdimensional Machinery</option>
                        </select>
                      </div>

                      {/* WEIGHT */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-brand-orange" /> Gross Cargo Weight (kg) <span className="text-brand-orange">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 1500"
                          value={quoteForm.weight}
                          onChange={(e) => setQuoteForm({ ...quoteForm, weight: e.target.value })}
                          className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                        />
                      </div>

                      {/* DIMENSIONS */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-brand-orange" /> Dimensions (L x W x H in cm) <span className="text-brand-orange">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 120 x 80 x 160 cm"
                          value={quoteForm.dimensions}
                          onChange={(e) => setQuoteForm({ ...quoteForm, dimensions: e.target.value })}
                          className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                        />
                      </div>

                      {/* DECLARED VALUE */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-brand-orange" /> Cargo Declared Value (USD)
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 50000"
                          value={quoteForm.declaredValue}
                          onChange={(e) => setQuoteForm({ ...quoteForm, declaredValue: e.target.value })}
                          className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                        />
                      </div>

                      {/* INCOTERMS */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-brand-orange" /> Incoterms Classification <span className="text-brand-orange">*</span>
                        </label>
                        <select
                          value={quoteForm.incoterms}
                          onChange={(e) => setQuoteForm({ ...quoteForm, incoterms: e.target.value })}
                          className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                        >
                          <option value="EXW">EXW – Ex Works</option>
                          <option value="FOB">FOB – Free On Board</option>
                          <option value="CIF">CIF – Cost Insurance & Freight</option>
                          <option value="DDP">DDP – Delivered Duty Paid</option>
                          <option value="FCA">FCA – Free Carrier</option>
                        </select>
                      </div>

                      {/* EXPECTED READY DATE */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-brand-orange" /> Cargo Readiness Date <span className="text-brand-orange">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={quoteForm.readyDate}
                          onChange={(e) => setQuoteForm({ ...quoteForm, readyDate: e.target.value })}
                          className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                        />
                      </div>

                      {/* DEADLINE FOR RESPONSE */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-brand-orange" /> Bid Submission Deadline <span className="text-brand-orange">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={quoteForm.deadline}
                          onChange={(e) => setQuoteForm({ ...quoteForm, deadline: e.target.value })}
                          className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* SPECIAL INSTRUCTIONS */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-brand-textHead">
                        Special Logistics Directives / Handling Instructions
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Mention temperature control details, non-stackable flags, fragile warnings, priority carrier guidelines..."
                        value={quoteForm.specialInstructions}
                        onChange={(e) => setQuoteForm({ ...quoteForm, specialInstructions: e.target.value })}
                        className="w-full p-3 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange focus:outline-none transition-all"
                      />
                    </div>

                    {/* Dispatch actions */}
                    <div className="pt-6 border-t border-brand-divider flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="text-xs text-brand-textMuted font-semibold">
                        This inquiry will email <span className="text-brand-orange font-bold text-sm">{forwarders.length}</span> active agencies in the CRM database.
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            // Save as Draft option
                            showToast('Draft feature coming soon! Or dispatch now directly.');
                          }}
                          className="bg-brand-cream hover:bg-brand-creamDark border border-brand-divider px-6 py-3 rounded-inner font-bold text-sm text-brand-textBody transition-all"
                        >
                          Save as Draft
                        </button>
                        
                        <button
                          type="submit"
                          disabled={isSubmittingQuote}
                          className="bg-brand-orange hover:bg-brand-orangeDark text-white px-8 py-3 rounded-inner font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSubmittingQuote ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {isEmailSending ? 'Emailing Partners...' : 'Saving...'}
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" /> Dispatch Bids Now
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </form>
                </>
              ) : (
                /* SUCCESS SCREEN */
                <div className="bg-brand-surface border border-brand-divider rounded-card p-12 shadow-brand text-center space-y-8 animate-zoom-in">
                  
                  {/* success animation checkmark container */}
                  <div className="success-checkmark">
                    <div className="check-icon">
                      <span className="icon-line line-tip"></span>
                      <span className="icon-line line-long"></span>
                      <div className="icon-circle"></div>
                      <div className="icon-fix"></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-brand-textHead">Campaign Successfully Dispatched!</h3>
                    <p className="text-brand-textBody font-medium text-sm max-w-lg mx-auto">
                      Shipment quotation request <span className="font-mono font-bold text-brand-orange">{createdQuoteSummary?.referenceId}</span> has been securely recorded. Professional RFQ emails were sent out to your logistics partners.
                    </p>
                  </div>

                  {/* Summary of dispatch */}
                  <div className="bg-brand-creamLight border border-brand-divider rounded-inner p-6 max-w-xl mx-auto text-left space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange border-b border-brand-divider pb-2">Campaign Broadcast Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                      <div>
                        <span className="text-brand-textMuted block">Shipment Ref ID</span>
                        <span className="text-brand-textHead font-mono font-bold">{createdQuoteSummary?.referenceId}</span>
                      </div>
                      <div>
                        <span className="text-brand-textMuted block">Total Outbox Count</span>
                        <span className="text-brand-textHead font-bold">{createdQuoteSummary?.forwardersEmailedCount || forwarders.length} Forwarders</span>
                      </div>
                      <div>
                        <span className="text-brand-textMuted block">Route Logistics</span>
                        <span className="text-brand-textHead font-bold">{createdQuoteSummary?.origin} &rarr; {createdQuoteSummary?.destination}</span>
                      </div>
                      <div>
                        <span className="text-brand-textMuted block">Cargo Mode</span>
                        <span className="text-brand-textHead font-bold">{createdQuoteSummary?.mode} • {createdQuoteSummary?.cargoType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 pt-4">
                    <button
                      onClick={() => handlePrintQuotePDF(createdQuoteSummary)}
                      className="bg-brand-cream hover:bg-brand-creamDark border border-brand-divider px-6 py-3 rounded-inner font-bold text-sm text-brand-textBody transition-all flex items-center gap-2"
                    >
                      <FileDown className="w-4 h-4" /> Save RFQ Invoice (PDF)
                    </button>
                    <button
                      onClick={() => { setShowSuccessScreen(false); setActiveTab('quotes'); }}
                      className="bg-brand-orange hover:bg-brand-orangeDark text-white px-8 py-3 rounded-inner font-bold text-sm transition-all shadow-sm"
                    >
                      View Campaign Registry
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ==================== TAB 4: QUOTES HISTORY ==================== */}
          {activeTab === 'quotes' && (
            <div className="space-y-8">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-bold tracking-tight text-brand-textHead">Quotation Campaign Registry</h2>
                  <p className="text-brand-textBody font-medium text-sm">Review full specifications of previous quotation calls, re-broadcast bid invites, copy clipboard templates, or save PDF summaries.</p>
                </div>
                <button
                  onClick={() => setActiveTab('new-quote')}
                  className="bg-brand-orange hover:bg-brand-orangeDark text-white px-5 py-3 rounded-inner font-bold text-sm transition-all shadow-sm flex items-center gap-2 self-start md:self-auto"
                >
                  <Plus className="w-5 h-5" /> Dispatch Shipment
                </button>
              </div>

              {/* Grid split view: history cards on left, detail panel on right */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side: Quotes List */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Search Bar */}
                  <div className="bg-brand-surface border border-brand-divider rounded-card p-4 shadow-brand flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-3 text-brand-textMuted w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search shipment logs by Reference ID, origin, destination..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 bg-brand-creamLight border border-brand-divider rounded-inner text-sm text-brand-textHead placeholder:text-brand-textMuted focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
                      />
                    </div>
                  </div>

                  {filteredQuotes.length === 0 ? (
                    <div className="bg-brand-surface border border-brand-divider rounded-card p-12 text-center flex flex-col items-center justify-center shadow-brand">
                      <FileText className="w-16 h-16 text-brand-divider mb-4" />
                      <h3 className="text-lg font-bold text-brand-textHead">No campaign logs found.</h3>
                      <p className="text-brand-textMuted text-sm mt-1 max-w-sm">Dispatch an automated bid broadside to initiate history records.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredQuotes.map((q) => (
                        <div 
                          key={q.id}
                          onClick={() => setSelectedQuote(q)}
                          className={`bg-brand-surface border rounded-card p-6 shadow-brand hover:shadow-brand-hover hover:border-brand-orange/40 transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden ${
                            selectedQuote?.id === q.id 
                              ? 'border-brand-orange ring-1 ring-brand-orange/20 bg-brand-creamLight/20' 
                              : 'border-brand-divider'
                          }`}
                        >
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-sm text-brand-textHead">{q.referenceId}</span>
                              
                              {/* Status Badges */}
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                q.status === 'Sent' 
                                  ? 'bg-orange-100 text-brand-orange border border-brand-orange/10' 
                                  : q.status === 'Pending'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-stone-100 text-stone-600 border border-stone-200'
                              }`}>
                                {q.status}
                              </span>
                              
                              <span className="text-[10px] bg-brand-cream px-2 py-0.5 rounded-full border border-brand-divider text-brand-textMuted font-bold">
                                {q.mode}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-brand-textMuted font-medium block">Origin Location</span>
                                <span className="text-brand-textHead font-bold">{q.origin}</span>
                              </div>
                              <div>
                                <span className="text-brand-textMuted font-medium block">Destination Terminal</span>
                                <span className="text-brand-textHead font-bold">{q.destination}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-[10px] text-brand-textMuted font-semibold pt-1 border-t border-brand-creamDark">
                              <span>Cargo Class: <strong>{q.cargoType}</strong></span>
                              <span>Weight: <strong>{q.weight} kg</strong></span>
                              {q.declaredValue > 0 && <span>Value: <strong>${q.declaredValue.toLocaleString()}</strong></span>}
                            </div>
                          </div>

                          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-brand-divider">
                            <span className="text-xs text-brand-textMuted font-semibold">
                              {new Date(q.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); copyEmailTemplateToClipboard(q); }}
                                className="p-2 text-brand-textBody hover:text-brand-orange hover:bg-brand-cream border border-brand-divider rounded-inner transition-all bg-brand-creamLight/50"
                                title="Copy Email Template to Clipboard"
                              >
                                {copiedQuoteId === q.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Clipboard className="w-4 h-4" />}
                              </button>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); handlePrintQuotePDF(q); }}
                                className="p-2 text-brand-textBody hover:text-brand-orange hover:bg-brand-cream border border-brand-divider rounded-inner transition-all bg-brand-creamLight/50"
                                title="Export RFQ PDF"
                              >
                                <FileDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

                {/* Right Side: Detailed Focus Panel */}
                <div className="lg:col-span-1">
                  
                  {selectedQuote ? (
                    <div className="bg-brand-surface border border-brand-divider rounded-card p-6 shadow-brand space-y-6 sticky top-6 animate-fade-in">
                      
                      <div className="flex items-center justify-between pb-4 border-b border-brand-divider">
                        <div>
                          <span className="text-[10px] text-brand-textMuted uppercase font-bold tracking-wider">Operational Focus</span>
                          <h3 className="text-base font-bold text-brand-textHead font-mono">{selectedQuote.referenceId}</h3>
                        </div>
                        <button 
                          onClick={() => setSelectedQuote(null)}
                          className="text-brand-textMuted hover:text-brand-orange font-bold text-sm"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-brand-creamLight border border-brand-divider rounded-inner flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-brand-textMuted block font-semibold uppercase">Campaign Outbox Status</span>
                            <span className="text-sm font-bold text-brand-textHead">
                              {selectedQuote.status === 'Sent' 
                                ? `Broadcast Out to ${selectedQuote.forwardersEmailedCount} Forwarders` 
                                : 'Incomplete Dispatch'}
                            </span>
                          </div>
                          
                          {selectedQuote.status === 'Pending' && (
                            <button
                              onClick={() => triggerManualEmailSend(selectedQuote)}
                              className="bg-brand-orange hover:bg-brand-orangeDark text-white px-3 py-1.5 rounded-inner text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" /> Dispatch
                            </button>
                          )}
                        </div>

                        {/* Route graphic */}
                        <div className="py-4 px-2 relative border-l-2 border-dashed border-brand-orange/40 ml-4 space-y-6 text-sm">
                          <div className="relative">
                            <div className="absolute -left-[17px] top-0.5 w-6 h-6 rounded-full bg-brand-orange/10 border border-brand-orange flex items-center justify-center text-[10px] font-bold text-brand-orange">
                              A
                            </div>
                            <div className="pl-6">
                              <strong className="text-brand-textHead">Origin cargo loader</strong>
                              <p className="text-xs text-brand-textBody font-medium mt-0.5">{selectedQuote.origin}</p>
                            </div>
                          </div>

                          <div className="relative">
                            <div className="absolute -left-[17px] top-0.5 w-6 h-6 rounded-full bg-brand-orange/10 border border-brand-orange flex items-center justify-center text-[10px] font-bold text-brand-orange">
                              B
                            </div>
                            <div className="pl-6">
                              <strong className="text-brand-textHead">Destination target dock</strong>
                              <p className="text-xs text-brand-textBody font-medium mt-0.5">{selectedQuote.destination}</p>
                            </div>
                          </div>
                        </div>

                        {/* Shipment specifications */}
                        <div className="border-t border-brand-divider pt-4 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange">Cargo Metadata Specification</h4>
                          
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold">
                            <div>
                              <span className="text-[10px] text-brand-textMuted block font-medium">Incoterms Class</span>
                              <span className="text-brand-textBody">{selectedQuote.incoterms}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-brand-textMuted block font-medium">Category</span>
                              <span className="text-brand-textBody">{selectedQuote.cargoType}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-brand-textMuted block font-medium">Gross Weight</span>
                              <span className="text-brand-textBody">{selectedQuote.weight} kg</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-brand-textMuted block font-medium">Readiness Date</span>
                              <span className="text-brand-textBody">{selectedQuote.readyDate || 'ASAP'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[10px] text-brand-textMuted block font-medium">Dimensions</span>
                              <span className="text-brand-textBody">{selectedQuote.dimensions}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[10px] text-brand-textMuted block font-medium">Valuation</span>
                              <span className="text-brand-textBody">${selectedQuote.declaredValue ? Number(selectedQuote.declaredValue).toLocaleString() : 'N/A'} USD</span>
                            </div>
                          </div>
                        </div>

                        {selectedQuote.specialInstructions && (
                          <div className="bg-brand-creamLight p-4 rounded-inner border border-brand-divider text-xs text-brand-textBody">
                            <strong className="text-[10px] text-brand-orange uppercase block mb-1">Outbox Notes</strong>
                            "{selectedQuote.specialInstructions}"
                          </div>
                        )}
                        
                        {/* Outbox Actions */}
                        <div className="border-t border-brand-divider pt-4 flex gap-2">
                          <button
                            onClick={() => copyEmailTemplateToClipboard(selectedQuote)}
                            className="flex-1 flex items-center justify-center gap-2 bg-brand-creamDark hover:bg-brand-cream border border-brand-divider text-brand-orange py-2.5 rounded-inner text-xs font-bold transition-all"
                          >
                            {copiedQuoteId === selectedQuote.id ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-600" /> Template Copied!
                              </>
                            ) : (
                              <>
                                <Clipboard className="w-4 h-4" /> Copy Email Template
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handlePrintQuotePDF(selectedQuote)}
                            className="flex items-center justify-center p-2.5 bg-brand-surface hover:bg-brand-cream border border-brand-divider rounded-inner text-brand-textBody transition-all"
                            title="Print RFQ Receipt"
                          >
                            <FileDown className="w-5 h-5" />
                          </button>
                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="bg-brand-surface border border-brand-divider rounded-card p-8 text-center text-brand-textMuted flex flex-col items-center justify-center shadow-brand py-16 sticky top-6">
                      <FileText className="w-12 h-12 text-brand-divider mb-3" />
                      <p className="text-xs font-bold">Select a Campaign Request</p>
                      <p className="text-[10px] text-brand-textMuted mt-1 leading-relaxed">Click any record on the left grid to pull complete cargo specifications, outbox status, and copy direct outbound templates.</p>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
