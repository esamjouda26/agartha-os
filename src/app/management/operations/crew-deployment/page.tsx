import DeploymentClient from "./deployment-client";
import { getSetupData, getDailyShifts } from "@/app/management/hr-roster/shifts/actions";

export default async function CrewDeploymentServerPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const resolvedParams = await searchParams;
  const dateParam = resolvedParams.date || new Date().toISOString().split("T")[0];
  
  // Directly pull identical standard dictionaries mapping the global database structure.
  const setupData = await getSetupData();
  const dailyShifts = await getDailyShifts(dateParam);

  return (
    <DeploymentClient 
      staff={setupData.staff} 
      dict={setupData.dict} 
      patterns={setupData.patterns} 
      dailyShifts={dailyShifts} 
      currentDate={dateParam}
    />
  );
}
