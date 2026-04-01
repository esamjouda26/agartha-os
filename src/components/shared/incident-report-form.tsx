"use client";

import { useState } from "react";
import { FormField } from "../ui/form-field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { SelectNative } from "../ui/select-native";
import { Button } from "../ui/button";
import { Camera } from "lucide-react";

export function IncidentReportForm() {
  const [department, setDepartment] = useState("");

  return (
    <div className="w-full max-w-lg bg-white/70 dark:bg-black/40 border border-gray-200 dark:border-white/10 shadow-sm backdrop-blur-md rounded-xl p-6 space-y-6 transition-colors">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-widest uppercase text-yellow-700 dark:text-[#d4af37] font-cinzel">File Incident Report</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Submit a formal notice for management review.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Incident Type">
          <SelectNative required defaultValue="">
            <option value="" disabled>Select Type</option>
            <option value="safety">Safety Hazard</option>
            <option value="maintenance">Maintenance Issue</option>
            <option value="guest">Guest Complaint</option>
            <option value="hr">HR / Staff Issue</option>
          </SelectNative>
        </FormField>

        <FormField label="Department">
          <SelectNative 
            required 
            value={department} 
            onChange={e => setDepartment(e.target.value)}
          >
            <option value="" disabled>Select Dept</option>
            <option value="fb">Food & Beverage</option>
            <option value="hk">Housekeeping</option>
            <option value="eng">Engineering</option>
            <option value="fo">Front Office</option>
          </SelectNative>
        </FormField>
      </div>

      <FormField label="Location Details">
        <Input placeholder="e.g. Lobby Restroom, Deck 4" />
      </FormField>

      <FormField label="Incident Description">
        <Textarea 
          placeholder="Please describe exactly what happened..." 
          className="min-h-[120px]"
        />
      </FormField>

      {/* Conditional Metadata based on department */}
      {department === "eng" && (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-4 transition-colors">
          <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Engineering Metadata</h3>
          <FormField label="Asset Tag Number (Optional)">
            <Input placeholder="Enter or scan barcode..." />
          </FormField>
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="w-full sm:w-auto">
          <Camera className="mr-2 h-4 w-4" /> Attach Photo
        </Button>
        <div className="flex-1"></div>
        <Button variant="ghost" className="w-full sm:w-auto">Cancel</Button>
        <Button variant="gold" className="w-full sm:w-auto">Submit Report</Button>
      </div>
    </div>
  );
}
