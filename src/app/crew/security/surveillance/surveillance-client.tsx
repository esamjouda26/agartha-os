"use client";

import { useState } from "react";
import { Cctv, Wifi, WifiOff, Filter, Circle } from "lucide-react";
import type { CameraDevice, Zone } from "./actions";

const STATUS_DOT: Record<string, string> = {
  online:      "text-emerald-400",
  offline:     "text-red-400",
  maintenance: "text-amber-400",
  decommissioned: "text-gray-600",
};

function getFeedUrl(camera: CameraDevice): string | null {
  if (camera.metadata && typeof camera.metadata === "object") {
    const m = camera.metadata as Record<string, unknown>;
    if (typeof m.stream_url === "string") return m.stream_url;
    if (typeof m.rtsp_url === "string") return m.rtsp_url;
  }
  if (camera.ip_address) return `http://${camera.ip_address as string}`;
  return null;
}

export default function SurveillanceClient({
  cameras,
  zones,
}: {
  cameras: CameraDevice[];
  zones: Zone[];
}) {
  const [selectedZone, setSelectedZone] = useState<string>("all");

  const filtered = selectedZone === "all"
    ? cameras
    : cameras.filter((c) => c.zone_id === selectedZone);

  const online  = cameras.filter((c) => c.status === "online").length;
  const offline = cameras.filter((c) => c.status === "offline").length;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="glass-panel-gold p-4 rounded-2xl border border-[#d4af37]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cctv className="text-[#d4af37] shrink-0" size={24} />
            <div>
              <h2 className="text-xl font-cinzel text-[#d4af37] font-bold">Zone Surveillance</h2>
              <p className="text-xs text-gray-400">{cameras.length} cameras</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-400"><Circle size={8} className="fill-current" /> {online} online</span>
            <span className="flex items-center gap-1 text-red-400"><Circle size={8} className="fill-current" /> {offline} offline</span>
          </div>
        </div>
      </div>

      {/* Zone filter */}
      {zones.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedZone("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition min-h-[44px] ${
              selectedZone === "all" ? "bg-[#d4af37] text-black border-[#d4af37]" : "bg-black/30 text-gray-400 border-white/10 hover:text-white"
            }`}
          >
            All Zones
          </button>
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => setSelectedZone(z.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition min-h-[44px] ${
                selectedZone === z.id ? "bg-[#d4af37] text-black border-[#d4af37]" : "bg-black/30 text-gray-400 border-white/10 hover:text-white"
              }`}
            >
              {z.name}
            </button>
          ))}
        </div>
      )}

      {/* Camera list */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-600 text-sm bg-black/20 rounded-2xl border border-white/5">
          No cameras in this zone
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((cam) => {
            const feedUrl = getFeedUrl(cam);
            const zone = zones.find((z) => z.id === cam.zone_id);
            return (
              <div key={cam.id} className="bg-black/30 border border-white/8 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <Cctv size={18} className={STATUS_DOT[cam.status] ?? "text-gray-500"} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-medium truncate">{cam.name}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${STATUS_DOT[cam.status] ?? "text-gray-500"}`}>
                        {cam.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      {zone && <span>{zone.name}</span>}
                      {cam.ip_address && <span className="font-mono">{cam.ip_address as string}</span>}
                      {cam.last_heartbeat && (
                        <span>Last seen: {new Date(cam.last_heartbeat).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                    </div>
                  </div>
                  {cam.status === "online" ? <Wifi size={16} className="text-emerald-400 shrink-0" /> : <WifiOff size={16} className="text-red-400 shrink-0" />}
                </div>

                {/* Feed link */}
                {feedUrl && cam.status === "online" && (
                  <div className="px-4 pb-3">
                    <a
                      href={feedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/10 transition min-h-[44px]"
                    >
                      Open Feed
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
