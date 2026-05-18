import React, { useState, useEffect, useMemo } from 'react';
import { 
  Inbox as InboxIcon, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ChevronRight,
  TrendingDown,
  Info,
  HelpCircle,
  BarChart2
} from 'lucide-react';
import { getQuotes, getBids, updateBidStatus, getForwarders } from '../storage.js';

function Badge({ icon: Icon, text, colorCls }) {
  return (
    <div className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md border ${colorCls}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {text}
    </div>
  );
}

function BidCard({ bid, isExpanded, onToggle, onApprove, onReject }) {
  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 relative overflow-hidden group
      ${bid.isBestValue ? 'border-[#F97316] shadow-[0_0_15px_2px_rgba(249,115,22,0.15)] ring-1 ring-[#F97316]/20' : 'border-[#FFE5CC] hover:border-[#F97316]/50 hover:shadow-md'}`}>
      
      {/* Top Banner for Best Value */}
      {bid.isBestValue && (
        <div className="bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white text-[10px] font-bold uppercase tracking-wider py-1.5 px-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5"/> AI Recommended Choice</span>
          <span>Score: {bid.score}/100</span>
        </div>
      )}

      <div className="p-5 cursor-pointer" onClick={onToggle}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-bold text-[#1C1009] text-base leading-none">{bid.forwarder?.company}</h4>
            <p className="text-xs text-[#8C7560] mt-1">{bid.forwarder?.name}</p>
          </div>
          <div className="text-right">
            <span className="block text-xl font-bold text-[#1C1009] leading-none mb-1">
              ${bid.price.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#8C7560] uppercase font-bold tracking-wider">Total {bid.currency}</span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          {bid.isLowestPrice && <Badge icon={TrendingDown} text="Lowest Price" colorCls="bg-emerald-50 text-emerald-700 border-emerald-200" />}
          {bid.isFastest && <Badge icon={Zap} text="Fastest Transit" colorCls="bg-blue-50 text-blue-700 border-blue-200" />}
          <Badge icon={Clock} text={`${bid.transitTimeDays} Days Transit`} colorCls="bg-[#FFF8F0] text-[#8C7560] border-[#FFE5CC]" />
          <Badge icon={ShieldCheck} text={`${bid.forwarder?.reliability}% Reliability`} colorCls="bg-[#FFF8F0] text-[#8C7560] border-[#FFE5CC]" />
        </div>

        {isExpanded && (
          <div className="pt-4 border-t border-[#FFE5CC] animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4 text-xs mb-4">
              <div><span className="block text-[#8C7560] mb-0.5">Carrier</span><span className="font-semibold text-[#1C1009]">{bid.carrier}</span></div>
              <div><span className="block text-[#8C7560] mb-0.5">Validity</span><span className="font-semibold text-[#1C1009]">{new Date(bid.validity).toLocaleDateString()}</span></div>
              <div className="col-span-2">
                <span className="block text-[#8C7560] mb-0.5">Conditions</span>
                <span className="font-medium text-[#4B3A2A] italic">"{bid.conditions}"</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-5">
              <button onClick={(e) => { e.stopPropagation(); onApprove(bid.id); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${bid.status==='approved'?'bg-emerald-100 text-emerald-800 border border-emerald-200':'bg-[#1C1009] hover:bg-[#4B3A2A] text-white'}`}>
                {bid.status==='approved' ? <><CheckCircle2 className="w-4 h-4"/> Approved</> : 'Approve Quote'}
              </button>
              <button onClick={(e) => { e.stopPropagation(); onReject(bid.id); }} className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${bid.status==='rejected'?'bg-rose-50 text-rose-700 border-rose-200':'bg-white text-[#8C7560] border-[#FFE5CC] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'}`}>
                {bid.status==='rejected' ? <XCircle className="w-4 h-4"/> : 'Reject'}
              </button>
              <button className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-[#FFE5CC] bg-[#FFFBF5] text-[#8C7560] hover:text-[#1C1009] hover:bg-[#FFE5CC] transition-all">
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Inbox({ showToast }) {
  const [quotes, setQuotes] = useState([]);
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  const [bids, setBids] = useState([]);
  const [expandedBid, setExpandedBid] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'compare'

  useEffect(() => {
    const qList = getQuotes().filter(q => q.status === 'Sent');
    setQuotes(qList);
    if (qList.length > 0 && !activeQuoteId) {
      setActiveQuoteId(qList[0].id);
    }
  }, []);

  useEffect(() => {
    if (activeQuoteId) {
      const bList = getBids(activeQuoteId);
      setBids(bList);
      if (bList.length > 0) setExpandedBid(bList[0].id); // expand top bid automatically
    }
  }, [activeQuoteId]);

  const handleApprove = (id) => {
    updateBidStatus(id, 'approved');
    setBids(getBids(activeQuoteId));
    showToast('Quote approved. Forwarder notified.', 'success');
  };

  const handleReject = (id) => {
    updateBidStatus(id, 'rejected');
    setBids(getBids(activeQuoteId));
    showToast('Quote rejected.');
  };

  const activeQuote = quotes.find(q => q.id === activeQuoteId);
  const bestBid = bids.find(b => b.isBestValue);
  const lowestBid = bids.find(b => b.isLowestPrice);
  const fastestBid = bids.find(b => b.isFastest);

  return (
    <div className="h-full flex gap-6 overflow-hidden max-h-screen">
      
      {/* ── LEFT SIDEBAR: Active Quotes ── */}
      <div className="w-64 shrink-0 flex flex-col space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1009] px-2 flex items-center gap-2">
          <InboxIcon className="w-4 h-4 text-[#F97316]"/> Bid Inbox
        </h3>
        
        <div className="bg-white border border-[#FFE5CC] rounded-2xl p-2 shadow-sm flex flex-col gap-1 overflow-y-auto max-h-full scrollbar-thin">
          {quotes.map(q => {
            const isActive = q.id === activeQuoteId;
            return (
              <button 
                key={q.id}
                onClick={() => setActiveQuoteId(q.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${
                  isActive ? 'bg-[#FFF8F0] border-[#F97316] shadow-sm' : 'border-transparent hover:bg-[#FFFBF5]'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-mono text-xs font-bold ${isActive ? 'text-[#F97316]' : 'text-[#1C1009]'}`}>{q.referenceId}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]"></div>}
                </div>
                <div className="text-[10px] text-[#8C7560] truncate">{q.origin} → {q.destination}</div>
              </button>
            )
          })}
          {quotes.length === 0 && <p className="p-4 text-xs text-[#8C7560] text-center">No active RFQs</p>}
        </div>
      </div>

      {/* ── MAIN INBOX AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto scrollbar-thin pb-20 pr-2">
        {activeQuote ? (
          <>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1C1009]">Bid Responses</h2>
                <p className="text-sm text-[#4B3A2A] mt-1">Viewing <strong>{bids.length}</strong> bids for {activeQuote.referenceId}</p>
              </div>
              <div className="flex bg-[#FFFBF5] border border-[#FFE5CC] rounded-lg p-1">
                <button onClick={()=>setViewMode('list')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode==='list'?'bg-white shadow-sm text-[#F97316]':'text-[#8C7560] hover:text-[#1C1009]'}`}>List View</button>
                <button onClick={()=>setViewMode('compare')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode==='compare'?'bg-white shadow-sm text-[#F97316]':'text-[#8C7560] hover:text-[#1C1009]'}`}>Compare Bids</button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="space-y-4 max-w-3xl">
                {bids.map(bid => (
                  <BidCard 
                    key={bid.id} 
                    bid={bid} 
                    isExpanded={expandedBid === bid.id}
                    onToggle={() => setExpandedBid(expandedBid === bid.id ? null : bid.id)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
                {bids.length === 0 && (
                  <div className="bg-white border border-[#FFE5CC] rounded-2xl p-16 text-center shadow-sm">
                    <Clock className="w-12 h-12 text-[#FFE5CC] mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-[#1C1009]">Awaiting Responses</h3>
                    <p className="text-sm text-[#8C7560] mt-1">Forwarders have not submitted bids yet.</p>
                  </div>
                )}
              </div>
            ) : (
              /* Compare Mode */
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                {bids.map(bid => (
                  <div key={bid.id} className={`shrink-0 w-72 bg-white rounded-2xl border p-5 snap-center ${bid.isBestValue ? 'border-[#F97316] shadow-md ring-1 ring-[#F97316]/20' : 'border-[#FFE5CC]'}`}>
                     {bid.isBestValue && <div className="text-[10px] bg-[#F97316] text-white font-bold uppercase py-1 px-3 rounded-full inline-block mb-3"><Sparkles className="w-3 h-3 inline mr-1"/> Recommended</div>}
                     <h4 className="font-bold text-[#1C1009]">{bid.forwarder?.company}</h4>
                     <div className="text-2xl font-bold text-[#1C1009] my-4">${bid.price.toLocaleString()}</div>
                     <div className="space-y-3 text-xs border-t border-[#FFE5CC] pt-4">
                       <div className="flex justify-between"><span className="text-[#8C7560]">Transit</span><span className="font-bold text-[#1C1009]">{bid.transitTimeDays} Days</span></div>
                       <div className="flex justify-between"><span className="text-[#8C7560]">Carrier</span><span className="font-bold text-[#1C1009]">{bid.carrier}</span></div>
                       <div className="flex justify-between"><span className="text-[#8C7560]">Reliability</span><span className="font-bold text-[#1C1009]">{bid.forwarder?.reliability}%</span></div>
                       <div className="flex justify-between"><span className="text-[#8C7560]">Score</span><span className="font-bold text-[#F97316]">{bid.score}/100</span></div>
                     </div>
                     <button onClick={() => handleApprove(bid.id)} className="w-full mt-6 bg-[#1C1009] hover:bg-[#4B3A2A] text-white py-2.5 rounded-xl text-xs font-bold transition-all">Approve</button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center"><p className="text-[#8C7560]">Select an active quotation</p></div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: AI Insights ── */}
      {bids.length > 0 && viewMode === 'list' && (
        <div className="w-80 shrink-0">
          <div className="bg-gradient-to-b from-[#FFFBF5] to-white border border-[#FFE5CC] rounded-2xl p-5 shadow-sm sticky top-0">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#FFF8F0] border border-[#FFE5CC] flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-[#F97316]" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1009]">Procurement AI</h3>
            </div>
            
            <div className="space-y-4">
              {bestBid && (
                <div className="bg-white border border-[#F97316]/30 p-4 rounded-xl shadow-[0_2px_8px_rgba(249,115,22,0.08)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#F97316]/10 to-transparent rounded-bl-full"></div>
                  <span className="text-[10px] text-[#F97316] font-bold uppercase tracking-wider mb-1 block">Best Overall Option</span>
                  <p className="text-xs text-[#4B3A2A] leading-relaxed">
                    <strong>{bestBid.forwarder?.company}</strong> offers the best balance of cost (${bestBid.price}) and delivery speed ({bestBid.transitTimeDays} days), achieving an AI score of <strong>{bestBid.score}</strong>.
                  </p>
                </div>
              )}
              
              <div className="bg-[#FFFBF5] border border-[#FFE5CC] p-4 rounded-xl">
                <span className="text-[10px] text-[#8C7560] font-bold uppercase tracking-wider mb-1 block flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Cost Analysis</span>
                <p className="text-xs text-[#4B3A2A] leading-relaxed">
                  Lowest bid is <strong>${lowestBid?.price}</strong> ({lowestBid?.forwarder?.company}). 
                  The average quote is <strong>${Math.round(bids.reduce((a,b)=>a+b.price,0)/bids.length)}</strong>.
                </p>
              </div>

              <div className="bg-[#FFFBF5] border border-[#FFE5CC] p-4 rounded-xl">
                <span className="text-[10px] text-[#8C7560] font-bold uppercase tracking-wider mb-1 block flex items-center gap-1"><Zap className="w-3 h-3"/> Speed Analysis</span>
                <p className="text-xs text-[#4B3A2A] leading-relaxed">
                  Fastest routing is <strong>{fastestBid?.transitTimeDays} days</strong> via {fastestBid?.carrier}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
