import { Bell } from "lucide-react";

export default function AnnouncementsPage() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold px-2">Announcements</h1>
      
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel-gold p-5 rounded-xl border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Operational Update #{i}</h3>
                <p className="text-sm text-gray-400">This is a system broadcast visible to all crew members. Please acknowledge upon reading.</p>
                <p className="text-[10px] text-[#d4af37] tracking-wider mt-3 uppercase">Today, 09:00 AM</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
