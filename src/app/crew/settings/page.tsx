import { Settings as SettingsIcon, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold px-2">Settings</h1>
      
      <div className="glass-panel-gold p-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-space border-2 border-[#d4af37]/40 flex items-center justify-center">
            <User className="w-8 h-8 text-[#d4af37]" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-white">{user?.user_metadata?.display_name || "Crew Member"}</h2>
            <p className="text-sm text-[#d4af37] uppercase tracking-wide">{user?.app_metadata?.staff_role || "Role"}</p>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full bg-white/5 hover:bg-white/10 text-white py-4 px-4 rounded-xl flex items-center justify-between border border-white/10 transition active:scale-[0.98]">
            <span className="flex items-center gap-3"><SettingsIcon className="w-5 h-5 text-gray-400" /> App Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
}
