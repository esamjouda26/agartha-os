"use client";

import { useState, useTransition } from "react";
import { Search, Package, MapPin, Clock, Camera, CheckCircle2, User, Phone, FileText, Upload, SearchCheck } from "lucide-react";
import { submitLostFoundReport, updateLostFoundStatus } from "./actions";

type ItemType = 'Lost' | 'Found';
type ItemStatus = 'Open' | 'Matched' | 'Claimed';

interface LostFoundItem {
  id: string;
  type: ItemType;
  itemName: string;
  description: string;
  location: string;
  dateReported: string;
  status: ItemStatus;
  contactName?: string;
  contactPhone?: string;
}

export default function LostFoundClient({ rawIncidents }: { rawIncidents: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ItemType>('Lost');
  const [showForm, setShowForm] = useState(false);

  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const items: LostFoundItem[] = rawIncidents.map(inc => ({
    id: inc.id,
    type: inc.metadata?.lafCategory === 'lost_report' ? 'Lost' : 'Found',
    itemName: inc.metadata?.itemName || 'Unknown Item',
    description: inc.description || '',
    location: inc.metadata?.location || 'Unknown Location',
    dateReported: inc.created_at,
    status: (inc.metadata?.lafStatus as ItemStatus) || 'Open',
    contactName: inc.metadata?.contactName,
    contactPhone: inc.metadata?.contactPhone
  }));

  const filteredItems = items.filter(item => item.type === activeTab);
  const openLostCount = items.filter(i => i.type === 'Lost' && i.status === 'Open').length;
  const openFoundCount = items.filter(i => i.type === 'Found' && i.status === 'Open').length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim() || !description.trim() || !location.trim()) return;

    startTransition(async () => {
      try {
        await submitLostFoundReport(
          activeTab === 'Lost' ? 'lost_report' : 'found_report',
          description,
          {
            itemName,
            location,
            lafStatus: 'Open',
            contactName: contactName.trim() ? contactName : undefined,
            contactPhone: contactPhone.trim() ? contactPhone : undefined
          }
        );
        setShowForm(false);
        setItemName('');
        setDescription('');
        setLocation('');
        setContactName('');
        setContactPhone('');
      } catch (err: any) {
        alert("AUDIT FAILURE: " + err.message);
      }
    });
  }

  function handleStatusChange(id: string, newStatus: ItemStatus, moveToFound: boolean = false) {
    startTransition(async () => {
      try {
        await updateLostFoundStatus(id, newStatus, moveToFound ? 'found_report' : undefined);
      } catch (err: any) {
        alert("AUDIT FAILURE: " + err.message);
      }
    });
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel-gold p-6 rounded-2xl border border-[#d4af37]/30">
        <div>
          <h2 className="text-2xl font-cinzel text-[#d4af37] font-bold flex items-center gap-3">
            <Search className="text-[#d4af37]" size={28} />
            Lost & Found Hub
          </h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-5 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 tracking-widest uppercase text-sm ${showForm ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gradient-to-r from-[#d4af37] to-[#806b45] text-space shadow-[0_4px_15px_rgba(212,175,55,0.3)]'}`}
        >
          {showForm ? 'Cancel Report' : `Report ${activeTab}`}
        </button>
      </div>

      {!showForm && (
        <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl w-full max-w-md border border-white/5">
          <button
            onClick={() => setActiveTab('Lost')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-lg font-bold text-sm transition-all tracking-wider ${activeTab === 'Lost'
              ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50'
              : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Search size={16} /> Lost ({openLostCount})
          </button>
          <button
            onClick={() => setActiveTab('Found')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-lg font-bold text-sm transition-all tracking-wider ${activeTab === 'Found'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
              : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <SearchCheck size={16} /> Found ({openFoundCount})
          </button>
        </div>
      )}

      {showForm && (
        <div className="glass-panel-gold border border-[#d4af37]/30 rounded-2xl p-6 shadow-xl animate-fadeIn space-y-6">
          <h3 className="text-lg font-cinzel text-[#d4af37] font-bold border-b border-white/10 pb-4">
            File New {activeTab} Report
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Item Name / Category <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input required type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Black iPhone 13" disabled={isPending} className="w-full bg-black/40 border border-white/10 text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-[#d4af37] transition-all placeholder-gray-600" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Location <span className="text-red-400">*</span></label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input required type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Near Zone 02" disabled={isPending} className="w-full bg-black/40 border border-white/10 text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-[#d4af37] transition-all placeholder-gray-600" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Detailed Description <span className="text-red-400">*</span></label>
              <div className="relative">
                <FileText size={16} className="absolute left-4 top-4 text-gray-500" />
                <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Identifying marks, contents..." disabled={isPending} className="w-full bg-black/40 border border-white/10 text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-[#d4af37] transition-all placeholder-gray-600 resize-none" />
              </div>
            </div>

            {activeTab === 'Lost' && (
              <div className="border-t border-white/10 pt-5">
                <h4 className="text-[10px] uppercase tracking-wider text-[#d4af37] font-bold mb-4">Guest Contact (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Guest Name" disabled={isPending} className="w-full bg-black/40 border border-white/10 text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-[#d4af37] transition-all placeholder-gray-600" />
                  </div>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Phone Number" disabled={isPending} className="w-full bg-black/40 border border-white/10 text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-[#d4af37] transition-all placeholder-gray-600" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Found' && (
              <div className="border-t border-white/10 pt-5">
                <button type="button" className="w-full md:w-auto flex items-center justify-center gap-2 border-2 border-dashed border-[#d4af37]/40 text-[#d4af37]/60 hover:text-[#d4af37] hover:border-[#d4af37] px-6 py-4 rounded-xl transition-all font-bold text-sm tracking-widest uppercase active:scale-[0.98]">
                  <Camera size={18} /> Capture Photo Proof
                </button>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-white/10 gap-3">
              <button disabled={isPending} type="submit" className="w-full bg-gradient-to-r from-[#d4af37] to-[#806b45] text-space font-bold tracking-widest uppercase rounded-xl py-4 active:scale-[0.98] transition shadow-[0_4px_15px_rgba(212,175,55,0.3)] disabled:opacity-50 flex items-center justify-center gap-2">
                <Upload size={18} /> Submit Report
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-black/20 border border-dashed border-white/10 rounded-2xl">
              <Search size={48} className="text-[#d4af37]/30 mb-4" />
              <h3 className="text-lg font-cinzel text-[#d4af37] font-bold mb-2">No {activeTab} Items</h3>
              <p className="text-gray-500 text-sm max-w-sm">No active JSONB incident payloads mapped to {activeTab}.</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="glass-panel-gold border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col h-full relative overflow-hidden transition-all hover:border-[#d4af37]/30">
                {item.status === 'Open' && <div className="absolute top-0 left-0 w-1 h-full bg-[#d4af37]" />}
                {item.status === 'Matched' && <div className="absolute top-0 left-0 w-1 h-full bg-blue-400" />}
                {item.status === 'Claimed' && <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />}

                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider">#{item.id.split('-')[0]}</span>
                    <h3 className="font-bold text-white text-lg">{item.itemName}</h3>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 border
                    ${item.status === 'Open' ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]' :
                      item.status === 'Matched' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                        'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                    {item.status}
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-5 leading-relaxed flex-grow">{item.description}</p>

                <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-white/5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <MapPin size={12} className="text-[#d4af37]" /> {item.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Clock size={12} className="text-[#d4af37]" /> {new Date(item.dateReported).toLocaleString()}
                  </div>
                  {item.contactName && (
                    <div className="flex items-center gap-2 text-xs text-gray-300 border-t border-white/5 pt-2 mt-2">
                      <User size={12} className="text-[#d4af37]" /> {item.contactName} {item.contactPhone && <span>({item.contactPhone})</span>}
                    </div>
                  )}
                </div>

                {item.status === 'Open' && (
                  <button disabled={isPending} onClick={() => handleStatusChange(item.id, activeTab === 'Lost' ? 'Matched' : 'Claimed', activeTab === 'Lost')} className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-white/5 border border-white/10 hover:border-white/30 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {activeTab === 'Lost' ? 'Mark Found (Match)' : 'Mark Claimed'}
                  </button>
                )}
                {item.status === 'Matched' && (
                  <button disabled={isPending} onClick={() => handleStatusChange(item.id, 'Claimed')} className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    <CheckCircle2 size={16} /> Set as Claimed
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
