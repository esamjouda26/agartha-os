"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radio";
import { Spinner } from "@/components/ui/spinner";
import { Sparkline } from "@/components/ui/sparkline";
import { QrCode } from "@/components/ui/qrcode";

import { FormField } from "@/components/ui/form-field";
import { SearchInput } from "@/components/ui/search-input";
import { KpiCard } from "@/components/ui/kpi-card";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { DateRangePills } from "@/components/ui/date-range-pills";
import { ToastAlert } from "@/components/ui/toast-alert";
import { OTPInputGroup } from "@/components/ui/otp-input-group";

import { GlobalModal } from "@/components/shared/global-modal";
import { DomainAuditTable } from "@/components/shared/domain-audit-table";
import { ItemSearchSelect } from "@/components/shared/item-search-select";
import { PosCart } from "@/components/shared/pos-cart";
import { CameraScanner } from "@/components/shared/camera-scanner";
import { IncidentReportForm } from "@/components/shared/incident-report-form";

import { PortalLayout } from "@/components/layouts/portal-layout";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { GuestLayout } from "@/components/layouts/guest-layout";
import { DashboardGrid } from "@/components/layouts/dashboard-grid";

import { Home, Users, Settings, Zap, DollarSign, Activity, Moon, Sun } from "lucide-react";
import { useToast } from "@/components/shared/toast-provider";
import { cn } from "@/lib/utils";

export default function SandboxPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("today");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  
  // Theme Toggle State 
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className={cn("min-h-screen w-full font-inter transition-colors duration-300", isDarkMode ? "dark" : "")}>
      <div className="bg-gray-100 dark:bg-black text-gray-900 dark:text-white min-h-screen pb-24 transition-colors">
        
        {/* Sticky Theme Toggle Header */}
        <div className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-7xl">
            <span className="font-cinzel font-bold tracking-widest uppercase text-yellow-700 dark:text-[#d4af37]">Agartha UI Labs</span>
            <Button 
              variant="outline" 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="rounded-full shadow-sm bg-white dark:bg-black dark:border-white/20"
            >
              {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-7xl space-y-24">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-cinzel text-yellow-700 dark:text-[#d4af37] font-bold tracking-widest uppercase transition-colors">
              AgarthaOS Sandbox
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto uppercase tracking-wider text-xs font-bold font-inter">
              Unified Atomic Design Component Library - Now With Universal Theme Support
            </p>
          </div>

          {/* --- ATOMS --- */}
          <section className="space-y-8">
            <h2 className="text-2xl font-cinzel text-yellow-700 dark:text-[#d4af37] border-b border-gray-200 dark:border-[#d4af37]/30 pb-4 transition-colors">
              1. Atoms
            </h2>

            <div className="space-y-12">
              {/* Buttons */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Buttons</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-2 flex flex-col items-center">
                    <span className="text-[10px] uppercase text-gray-400">Default</span>
                    <Button>Default</Button>
                    <Button className="opacity-80">Hover</Button>
                    <Button className="scale-95">Active</Button>
                    <Button disabled>Disabled</Button>
                  </div>
                  <div className="space-y-2 flex flex-col items-center">
                    <span className="text-[10px] uppercase text-gray-400">Gold</span>
                    <Button variant="gold">Gold Btn</Button>
                    <Button variant="gold" className="bg-yellow-600 dark:bg-white text-white dark:text-black">Hover</Button>
                    <Button variant="gold" className="scale-95">Active</Button>
                    <Button variant="gold" disabled>Disabled</Button>
                  </div>
                  <div className="space-y-2 flex flex-col items-center">
                    <span className="text-[10px] uppercase text-gray-400">Outline</span>
                    <Button variant="outline">Outline</Button>
                    <Button variant="outline" className="bg-gray-100 dark:bg-white/5">Hover</Button>
                    <Button variant="outline" className="scale-95">Active</Button>
                    <Button variant="outline" disabled>Disabled</Button>
                  </div>
                  <div className="space-y-2 flex flex-col items-center">
                    <span className="text-[10px] uppercase text-gray-400">Destructive</span>
                    <Button variant="destructive">Delete</Button>
                    <Button variant="destructive" className="opacity-80">Hover</Button>
                    <Button variant="destructive" className="scale-95">Active</Button>
                    <Button variant="destructive" disabled>Disabled</Button>
                  </div>
                  <div className="space-y-2 flex flex-col items-center">
                    <span className="text-[10px] uppercase text-gray-400">Ghost</span>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="ghost" className="bg-gray-100 dark:bg-white/5 dark:text-white text-gray-900">Hover</Button>
                    <Button variant="ghost" className="scale-95">Active</Button>
                    <Button variant="ghost" disabled>Disabled</Button>
                  </div>
                </div>
                {/* Sizes & States */}
                <div className="flex flex-wrap items-center gap-4 mt-6 p-4 bg-white shadow-sm border border-gray-200 dark:bg-white/5 rounded-xl dark:border-white/10 transition-colors">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large Size</Button>
                  <Button size="icon"><Home className="w-5 h-5" /></Button>
                  <Button isLoading>Loading</Button>
                </div>
              </div>

              {/* Badges */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Badges / StatusPills</h3>
                <div className="flex flex-wrap gap-4 p-4 border border-gray-200 bg-white shadow-sm dark:bg-transparent dark:border-white/10 rounded-xl transition-colors">
                  <Badge>Default</Badge>
                  <Badge variant="gold">Gold</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>

              {/* Inputs & Forms */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Form Controls (min-h-[44px])</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField label="Standard Input">
                    <Input placeholder="Enter value..." />
                  </FormField>
                  <FormField label="Select Native">
                    <SelectNative defaultValue="2">
                      <option value="1">Option One</option>
                      <option value="2">Option Two</option>
                    </SelectNative>
                  </FormField>
                  <FormField label="Disabled Input">
                    <Input placeholder="Not allowed" disabled />
                  </FormField>
                  
                  <div className="col-span-full">
                    <FormField label="Textarea">
                      <Textarea placeholder="Type your message here..." />
                    </FormField>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox defaultChecked />
                      <span className="text-sm uppercase font-bold text-gray-900 dark:text-white tracking-widest text-[10px]">Checkbox Active</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox disabled />
                      <span className="text-sm uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest text-[10px]">Disabled</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Radio name="demo" defaultChecked />
                      <span className="text-sm uppercase font-bold text-gray-900 dark:text-white tracking-widest text-[10px]">Radio One</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Radio name="demo" />
                      <span className="text-sm uppercase font-bold text-gray-900 dark:text-white tracking-widest text-[10px]">Radio Two</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Indicators */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Indicators & Misc</h3>
                <div className="flex flex-wrap items-center gap-12 p-6 border border-gray-200 shadow-sm bg-white dark:border-white/10 rounded-xl dark:bg-black/40 transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="lg" className="text-yellow-700 dark:text-[#d4af37]" />
                    <span className="text-[10px] uppercase text-gray-500 font-bold">Spinner</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Sparkline data={[10, 25, 40, 20, 60, 45, 80, 55]} color="#10b981" />
                    <span className="text-[10px] uppercase text-gray-500 font-bold">Sparkline</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <QrCode value="https://agarthaos.com" size={80} className="border border-gray-200 dark:border-transparent" />
                    <span className="text-[10px] uppercase text-gray-500 font-bold">Mock QR</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* --- MOLECULES --- */}
          <section className="space-y-8">
            <h2 className="text-2xl font-cinzel text-yellow-700 dark:text-[#d4af37] border-b border-gray-200 dark:border-[#d4af37]/30 pb-4 transition-colors">
              2. Molecules
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 border border-gray-200 bg-white shadow-sm dark:bg-transparent dark:border-white/10 p-6 rounded-xl transition-colors">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Search Input</h3>
                <SearchInput placeholder="Search crew members..." />
              </div>

              <div className="space-y-4 border border-gray-200 bg-white shadow-sm dark:bg-transparent dark:border-white/10 p-6 rounded-xl flex flex-col justify-center transition-colors">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Date Range Pills</h3>
                <DateRangePills value={dateRange} onChange={setDateRange} />
              </div>

              <div className="space-y-4 border border-gray-200 bg-white shadow-sm dark:bg-transparent dark:border-white/10 p-6 rounded-xl transition-colors">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Filter Dropdown</h3>
                <FilterDropdown 
                  title="Departments"
                  options={[
                    { label: "Engineering", value: "eng" },
                    { label: "Housekeeping", value: "hk" },
                    { label: "Food & Beverage", value: "fb" },
                  ]}
                  selectedValues={selectedFilters}
                  onChange={setSelectedFilters}
                />
              </div>

              <div className="space-y-4 border border-gray-200 bg-white shadow-sm dark:bg-transparent dark:border-white/10 p-6 rounded-xl flex flex-col justify-center transition-colors">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Interactable Toasts</h3>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => toast({ title: "Operation Successful", type: "success" })} variant="outline" className="text-emerald-700 border-emerald-500/30 bg-emerald-50 hover:bg-emerald-100 dark:bg-transparent dark:text-emerald-400 dark:border-emerald-400/30">Success</Button>
                  <Button size="sm" onClick={() => toast({ title: "Connection Lost", message: "Retrying in 5s...", type: "error" })} variant="outline" className="text-red-700 border-red-500/30 bg-red-50 hover:bg-red-100 dark:bg-transparent dark:text-red-400 dark:border-red-400/30">Error</Button>
                  <Button size="sm" onClick={() => toast({ title: "New Message Received", type: "info" })} variant="outline" className="text-blue-700 border-blue-500/30 bg-blue-50 hover:bg-blue-100 dark:bg-transparent dark:text-blue-400 dark:border-blue-400/30">Info</Button>
                  <Button size="sm" onClick={() => toast({ title: "Low Inventory", type: "warning" })} variant="outline" className="text-amber-700 border-amber-500/30 bg-amber-50 hover:bg-amber-100 dark:bg-transparent dark:text-amber-400 dark:border-amber-400/30">Warning</Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">KPI Cards Grid</h3>
              <DashboardGrid>
                <KpiCard title="Total Revenue" value="$45,231" icon={<DollarSign className="w-5 h-5"/>} trend={12.5} trendLabel="vs last week" sparklineData={[20,30,25,45,60,50,80]} />
                <KpiCard title="Active Users" value="1,204" icon={<Users className="w-5 h-5"/>} trend={-2.4} trendLabel="vs last month" sparklineData={[80,75,60,65,50,55,40]} />
                <KpiCard title="System Uptime" value="99.9%" icon={<Zap className="w-5 h-5"/>} trend={0} sparklineData={[99,99,99.9,99.9,99.9,99.9]} />
                <KpiCard title="Server Load" value="45%" icon={<Activity className="w-5 h-5"/>} />
              </DashboardGrid>
            </div>

            <div className="space-y-4 border border-gray-200 bg-white shadow-sm dark:bg-transparent dark:border-white/10 p-6 rounded-xl flex flex-col items-center transition-colors">
              <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">OTP Input Group</h3>
              <OTPInputGroup length={6} onComplete={(code) => toast({ title: "Code Entered", message: code, type: "info" })} />
            </div>
          </section>

          {/* --- ORGANISMS --- */}
          <section className="space-y-8">
            <h2 className="text-2xl font-cinzel text-yellow-700 dark:text-[#d4af37] border-b border-gray-200 dark:border-[#d4af37]/30 pb-4 transition-colors">
              3. Organisms
            </h2>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest flex items-center justify-between">
                Global Modal
                <Button variant="gold" onClick={() => setIsModalOpen(true)}>Trigger Modal</Button>
              </h3>
              <GlobalModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="Authentication Required"
                footer={
                  <>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button variant="gold" onClick={() => setIsModalOpen(false)}>Confirm</Button>
                  </>
                }
              >
                <div className="space-y-6 text-center py-4">
                  <Zap className="h-12 w-12 text-yellow-700 dark:text-[#d4af37] mx-auto opacity-80" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Please confirm your credentials to execute this operation. 
                  </p>
                  <OTPInputGroup length={4} className="mt-6" />
                </div>
              </GlobalModal>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Data Table Suite w/ Hook Integration</h3>
              <div className="p-4 sm:p-6 border border-gray-200 bg-gray-50 dark:bg-[#040608] shadow-sm dark:border-white/10 rounded-xl transition-colors">
                <DomainAuditTable />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Complex Forms & Inputs</h3>
                <div className="space-y-8">
                  <IncidentReportForm />
                  <div className="p-6 border border-gray-200 bg-white shadow-sm dark:bg-black/40 dark:border-white/10 rounded-xl transition-colors">
                    <h4 className="text-xs uppercase font-bold text-gray-600 dark:text-gray-500 tracking-widest mb-4">Item Search Select (Combobox)</h4>
                    <p className="text-xs text-gray-500 mb-4">Demonstrates grouped mock data, sticky headers, open transition, and keyboard navigation (try interacting with Up/Down arrows and Enter).</p>
                    <ItemSearchSelect />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Domain UI Utilities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full max-h-[600px]">
                  <PosCart />
                  <CameraScanner />
                </div>
              </div>
            </div>
          </section>

          {/* --- TEMPLATES / LAYOUTS --- */}
          <section className="space-y-8">
            <h2 className="text-2xl font-cinzel text-yellow-700 dark:text-[#d4af37] border-b border-gray-200 dark:border-[#d4af37]/30 pb-4 transition-colors">
              4. Templates & Layouts
            </h2>

            <p className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
              Bounded inside fixed-height containers to prevent viewport hijacking.
            </p>

            <div className="space-y-12">
              {/* Portal Layout */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Portal Layout</h3>
                <div className="relative w-full h-[600px] border-2 border-dashed border-yellow-500/50 dark:border-[#d4af37]/50 rounded-xl overflow-hidden shadow-2xl mt-4 bg-gray-50 dark:bg-[#020408] transition-colors">
                  <PortalLayout 
                    userName="Admin User" 
                    roleLabel="System Architect"
                    navItems={[
                      { label: "Dashboard", href: "#", icon: <Home className="w-5 h-5"/>, active: true },
                      { label: "Users", href: "#", icon: <Users className="w-5 h-5"/> },
                      { label: "Settings", href: "#", icon: <Settings className="w-5 h-5"/> }
                    ]}
                  >
                    <div className="space-y-4">
                      <h2 className="text-xl font-cinzel text-gray-900 dark:text-white uppercase tracking-widest">Dashboard</h2>
                      <DashboardGrid>
                        <KpiCard title="Active Crews" value="42" />
                        <KpiCard title="Total Guests" value="1,200" />
                      </DashboardGrid>
                      <div className="h-96 border border-gray-200 bg-white shadow-sm dark:bg-transparent dark:border-white/10 rounded-xl flex items-center justify-center text-gray-500 text-sm italic">
                        Scrollable main content area...
                      </div>
                    </div>
                  </PortalLayout>
                </div>
              </div>

              {/* Auth Layout */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Auth Layout</h3>
                <div className="relative w-full h-[600px] border-2 border-dashed border-yellow-500/50 dark:border-[#d4af37]/50 rounded-xl overflow-hidden shadow-2xl mt-4 bg-gray-50 dark:bg-[#020408] transition-colors">
                  <AuthLayout title="Admin Login" subtitle="Secure Gateway">
                    <form className="space-y-4 w-full" onSubmit={(e) => e.preventDefault()}>
                      <FormField label="Identifier">
                        <Input placeholder="Crew ID or Email" />
                      </FormField>
                      <FormField label="Passcode">
                        <Input type="password" placeholder="••••••••" />
                      </FormField>
                      <Button variant="gold" className="w-full mt-4">Authenticate</Button>
                    </form>
                  </AuthLayout>
                </div>
              </div>

              {/* Guest Layout */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Guest Layout (Mobile First Simulation)</h3>
                <div className="relative w-full max-w-md mx-auto h-[700px] border-2 border-dashed border-yellow-500/50 dark:border-[#d4af37]/50 rounded-3xl overflow-hidden shadow-2xl mt-4 isolate bg-gray-50 dark:bg-[#020408] transition-colors">
                  <GuestLayout>
                    <div className="p-6 space-y-6">
                      <h1 className="text-2xl font-cinzel font-bold text-gray-900 dark:text-white tracking-widest">Welcome Aboard</h1>
                      <div className="aspect-video bg-white shadow-sm dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center">
                        <QrCode value="demo-qr" size={150} className="opacity-80 border-transparent dark:border-transparent" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-16 bg-white shadow-sm dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10" />
                        <div className="h-16 bg-white shadow-sm dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10" />
                        <div className="h-16 bg-white shadow-sm dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10" />
                        <div className="h-16 bg-white shadow-sm dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10" />
                      </div>
                    </div>
                  </GuestLayout>
                </div>
              </div>

            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
