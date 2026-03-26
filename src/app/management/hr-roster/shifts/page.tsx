import ShiftsClient from "./shifts-client";
import { getSetupData, getDailyShifts } from "./actions";

export default async function ShiftSchedulingPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const resolvedParams = await searchParams;
  const dateParam = resolvedParams.date || new Date().toISOString().split("T")[0];
  
  // Await fetch from Supabase
  const setupData = await getSetupData();
  const dailyShifts = await getDailyShifts(dateParam);

  return (
    <ShiftsClient 
      staff={setupData.staff} 
      dict={setupData.dict} 
      patterns={setupData.patterns} 
      dailyShifts={dailyShifts} 
      currentDate={dateParam}
    />
  );
}
