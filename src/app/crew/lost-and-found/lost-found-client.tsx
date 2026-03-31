"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, Clock, Camera, CheckCircle2, User, Phone, FileText, Upload, SearchCheck, UserCheck } from "lucide-react";
import { submitLostFoundReport, resolveLostFoundIncident } from "./actions";

type ItemType = 'Lost' | 'Found';

export default function LostFoundClient({ rawIncidents, zones }: { rawIncidents: any[], zones: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ItemType>('Lost');
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [lafType, setLafType] = useState<'lost_child' | 'lost_item' | 'found_child' | 'found_item'>('lost_item');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  // Resolution State
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionPhoto, setResolutionPhoto] = useState<string | null>(null);

  const items = rawIncidents.map(inc => ({
    id: inc.id,
    type: inc.category === 'lost_report' ? 'Lost' : 'Found',
    lafType: inc.metadata?.laf_type || 'unknown',
    itemName: inc.metadata?.item_name || 'Unknown',
    description: inc.description || '',
    zoneName: inc.zones?.name || 'Unknown Location',
    dateReported: inc.created_at,
    status: inc.status,
    contactName: inc.metadata?.guest_name,
    contactPhone: inc.metadata?.guest_phone,
    attachmentUrl: inc.attachment_url
  }));

  const filteredItems = items.filter(item => item.type === activeTab);
  const openLostCount = items.filter(i => i.type === 'Lost' && i.status === 'open').length;
  const openFoundCount = items.filter(i => i.type === 'Found' && i.status === 'open').length;

  // Handle Tab Switch smoothly resetting enums
  function handleTabSwitch(tab: ItemType) {
    setActiveTab(tab);
    setLafType(tab === 'Lost' ? 'lost_item' : 'found_item');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim() || !description.trim() || !zoneId) return;
    
    if (activeTab === 'Found' && !attachmentUrl) {
      alert("AUDIT BLOCK: Found reports mandate a photo attachment of the physical asset/person.");
      return;
    }

    startTransition(async () => {
      try {
        await submitLostFoundReport(
          activeTab === 'Lost' ? 'lost_report' : 'found_report',
          description,
          zoneId,
          attachmentUrl,
          {
            laf_type: lafType,
            item_name: itemName,
            guest_name: contactName.trim() ? contactName : undefined,
            guest_phone: contactPhone.trim() ? contactPhone : undefined
          }
        );
        setShowForm(false);
        setItemName('');
        setDescription('');
        setZoneId('');
        setContactName('');
        setContactPhone('');
        setAttachmentUrl(null);
      } catch (err: any) {
        alert("AUDIT FAILURE: " + err.message);
      }
    });
  }

  function handleResolve(id: string, requiresPhoto: boolean) {
    if (requiresPhoto && !resolutionPhoto) {
      alert("AUDIT BLOCK: Resolving a Lost Report requires photographic proof of return.");
      return;
    }
    startTransition(async () => {
      try {
        await resolveLostFoundIncident(id, resolutionPhoto);
        setResolvingId(null);
        setResolutionPhoto(null);
      } catch (err: any) {
        alert("AUDIT FAILURE: " + err.message);
      }
    });
  }

  // Shared camera state machine (serves both attachment + resolution photos)
  type CameraState = "idle" | "capturing" | "preview";
  type CameraTarget = "attachment" | "resolution";
  const [cameraState, setCameraState]   = useState<CameraState>("idle");
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>("attachment");
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
  useEffect(() => () => stopStream(), [stopStream]);
  useEffect(() => {
    if (cameraState === "capturing" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraState]);

  function openCamera(target: CameraTarget) {
    setCameraTarget(target);
    setCameraState("capturing");
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        requestAnimationFrame(() => {
          if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
        });
      })
      .catch(() => setCameraState("idle"));
  }
  function capturePhoto() {
    const v = videoRef.current; const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const data = c.toDataURL("image/jpeg", 0.85);
    if (cameraTarget === "attachment") setAttachmentUrl(data);
    else setResolutionPhoto(data);
    stopStream(); setCameraState("preview");
  }
  function cancelCamera() { stopStream(); setCameraState("idle"); }
  function retakeCamera() {
    if (cameraTarget === "attachment") setAttachmentUrl(null);
    else setResolutionPhoto(null);
    stopStream(); openCamera(cameraTarget);
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
            onClick={() => handleTabSwitch('Lost')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-lg font-bold text-sm transition-all tracking-wider ${activeTab === 'Lost'
              ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50'
              : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Search size={16} /> Lost ({openLostCount})
          </button>
          <button
            onClick={() => handleTabSwitch('Found')}
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
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Report Type <span className="text-red-400">*</span></label>
                <div className="relative">
                  <UserCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select 
                    value={lafType} 
                    onChange={(e) => setLafType(e.target.value as any)} 
                    disabled={isPending} 
                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-[#d4af37] transition-all appearance-none"
                  >
                    {activeTab === 'Lost' ? (
                      <>
                        <option value="lost_item">Lost Item (Property)</option>
                        <option value="lost_child">Lost Child (Person)</option>
                      </>
                    ) : (
                      <>
                        <option value="found_item">Found Item (Property)</option>
                        <option value="found_child">Found Child (Person)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Item/Person Name <span className="text-red-400">*</span></label>
                <input required type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Black iPhone 13 or 'Tommy'" disabled={isPending} className="w-full bg-black/40 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#d4af37] transition-all placeholder-gray-600" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Physical Zone <span className="text-red-400">*</span></label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <select required value={zoneId} onChange={(e) => setZoneId(e.target.value)} disabled={isPending} className="w-full bg-black/40 border border-white/10 text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-[#d4af37] transition-all appearance-none">
                  <option value="" disabled>Select the Incident Zone...</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Detailed Description <span className="text-red-400">*</span></label>
              <div className="relative">
                <FileText size={16} className="absolute left-4 top-4 text-gray-500" />
                <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Identifying marks, contents, clothing..." disabled={isPending} className="w-full bg-black/40 border border-white/10 text-white rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-[#d4af37] transition-all placeholder-gray-600 resize-none" />
              </div>
            </div>

            {activeTab === 'Lost' && (
              <div className="border-t border-white/10 pt-5">
                <h4 className="text-[10px] uppercase tracking-wider text-[#d4af37] font-bold mb-4">Distressed Guest Contact (Optional)</h4>
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

            {(activeTab === 'Found' || attachmentUrl) && (
              <div className="border-t border-white/10 pt-5 space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold flex justify-between">
                  <span>Photo Attachment {activeTab === 'Found' && <span className="text-red-400">*</span>}</span>
                  {attachmentUrl && <span className="text-green-400">Captured</span>}
                </label>
                {/* Camera box — shared, only visible when target is attachment */}
                {cameraState === "capturing" && cameraTarget === "attachment" && (
                  <div className="relative rounded-xl overflow-hidden border border-[#d4af37]/30 bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-56 object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/20 border border-red-500/40 rounded-full px-2 py-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-[10px] text-red-400 font-bold">LIVE</span>
                    </div>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                      <button type="button" onClick={cancelCamera} className="px-4 py-2 rounded-full bg-black/60 text-gray-400 text-xs font-bold">Cancel</button>
                      <button type="button" onClick={capturePhoto} className="w-12 h-12 rounded-full bg-white border-4 border-[#d4af37] flex items-center justify-center shadow-xl active:scale-95 transition">
                        <Camera size={18} className="text-black" />
                      </button>
                    </div>
                  </div>
                )}
                {(cameraState === "preview" && cameraTarget === "attachment") || (cameraState === "idle" && attachmentUrl) ? (
                  attachmentUrl ? (
                    <div className="space-y-2">
                      <img src={attachmentUrl} alt="Attachment" className="w-full h-40 object-cover rounded-xl border border-green-500/30" />
                      {cameraState === "preview" && cameraTarget === "attachment" ? (
                        <div className="flex gap-2">
                          <button type="button" onClick={retakeCamera} className="flex-1 py-2 rounded-lg text-xs font-bold border border-white/10 text-gray-400 hover:bg-white/5">Retake</button>
                          <button type="button" onClick={() => setCameraState("idle")} className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#d4af37] text-black">Confirm</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setAttachmentUrl(null)} className="text-xs text-red-400 hover:text-red-300">Remove photo</button>
                      )}
                    </div>
                  ) : null
                ) : cameraState !== "capturing" && !attachmentUrl ? (
                  <button type="button" onClick={() => openCamera("attachment")} className="w-full md:w-auto flex items-center justify-center gap-2 border-2 border-dashed border-[#d4af37]/40 text-[#d4af37]/60 hover:text-[#d4af37] hover:border-[#d4af37] px-6 py-4 rounded-xl transition-all font-bold text-sm tracking-widest uppercase active:scale-[0.98]">
                    <Camera size={18} /> Capture Photo Proof
                  </button>
                ) : null}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-white/10 gap-3">
              <button disabled={isPending} type="submit" className="w-full bg-gradient-to-r from-[#d4af37] to-[#806b45] text-space font-bold tracking-widest uppercase rounded-xl py-4 active:scale-[0.98] transition shadow-[0_4px_15px_rgba(212,175,55,0.3)] disabled:opacity-50 flex items-center justify-center gap-2">
                <Upload size={18} /> File Record
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
              <h3 className="text-lg font-cinzel text-[#d4af37] font-bold mb-2">No {activeTab} Records</h3>
              <p className="text-gray-500 text-sm max-w-sm">The operational log for {activeTab.toLowerCase()} items is currently empty.</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="glass-panel-gold border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col h-full relative overflow-hidden transition-all hover:border-[#d4af37]/30">
                {item.status === 'open' && <div className="absolute top-0 left-0 w-1 h-full bg-[#d4af37]" />}
                {item.status === 'resolved' && <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />}

                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider">#{item.id.split('-')[0]} • {item.lafType.replace('_', ' ')}</span>
                    <h3 className="font-bold text-white text-lg">{item.itemName}</h3>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 border
                    ${item.status === 'open' ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]' :
                        'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                    {item.status}
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-5 leading-relaxed flex-grow">{item.description}</p>

                <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-white/5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <MapPin size={12} className="text-[#d4af37]" /> {item.zoneName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Clock size={12} className="text-[#d4af37]" /> {new Date(item.dateReported).toLocaleString()}
                  </div>
                  {item.contactName && (
                    <div className="flex items-center gap-2 text-xs text-gray-300 border-t border-white/5 pt-2 mt-2">
                      <User size={12} className="text-[#d4af37]" /> {item.contactName} {item.contactPhone && <span>({item.contactPhone})</span>}
                    </div>
                  )}
                  {item.attachmentUrl && (
                    <div className="flex items-center gap-2 text-xs text-blue-400 border-t border-white/5 pt-2 mt-2 font-bold">
                      <Camera size={12} /> Image Attached
                    </div>
                  )}
                </div>

                {item.status === 'open' && resolvingId !== item.id && (
                  <button disabled={isPending} onClick={() => setResolvingId(item.id)} className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-white/5 border border-white/10 hover:border-white/30 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    Mark Resolved
                  </button>
                )}

                {resolvingId === item.id && (
                   <div className="space-y-3 bg-black/50 p-4 rounded-xl border border-[#d4af37]/40 animate-fadeIn">
                      <p className="text-xs text-gray-300 text-center">Finalizing Resolution Loop</p>
                      {activeTab === 'Lost' && (
                        <>
                          {/* Camera box for resolution proof */}
                          {cameraState === "capturing" && cameraTarget === "resolution" && (
                            <div className="relative rounded-xl overflow-hidden border border-[#d4af37]/30 bg-black">
                              <video ref={videoRef} autoPlay playsInline muted className="w-full h-40 object-cover" />
                              <canvas ref={canvasRef} className="hidden" />
                              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                                <button type="button" onClick={cancelCamera} className="px-3 py-1.5 rounded-full bg-black/60 text-gray-400 text-xs font-bold">Cancel</button>
                                <button type="button" onClick={capturePhoto} className="w-10 h-10 rounded-full bg-white border-2 border-[#d4af37] flex items-center justify-center active:scale-95 transition">
                                  <Camera size={14} className="text-black" />
                                </button>
                              </div>
                            </div>
                          )}
                          {resolutionPhoto && cameraState !== "capturing" ? (
                            <div className="space-y-1">
                              <img src={resolutionPhoto} alt="Resolution proof" className="w-full h-28 object-cover rounded-lg border border-green-500/30" />
                              {cameraState === "preview" && cameraTarget === "resolution" && (
                                <div className="flex gap-2">
                                  <button type="button" onClick={retakeCamera} className="flex-1 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-gray-400">Retake</button>
                                  <button type="button" onClick={() => setCameraState("idle")} className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-[#d4af37] text-black">Confirm</button>
                                </div>
                              )}
                            </div>
                          ) : cameraState !== "capturing" && (
                            <button type="button" onClick={() => openCamera("resolution")} className={`w-full py-2 rounded-lg font-bold text-xs uppercase border border-dashed border-[#d4af37]/40 text-[#d4af37]`}>
                              Capture Return Proof *
                            </button>
                          )}
                        </>
                       )}
                       <div className="flex gap-2">
                        <button disabled={isPending} onClick={() => handleResolve(item.id, activeTab === 'Lost')} className="flex-1 py-2 rounded-lg font-bold text-xs uppercase bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 disabled:opacity-50">
                          Confirm
                        </button>
                        <button disabled={isPending} onClick={() => { setResolvingId(null); setResolutionPhoto(null); }} className="flex-1 py-2 rounded-lg font-bold text-xs uppercase bg-red-500/10 text-red-400 border border-red-500/30">
                          Cancel
                        </button>
                      </div>
                   </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
