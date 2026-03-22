"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { ChartContainer } from "@/components/shared";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

/* ── Efficiency Chart (Spend vs CAC) ─────────────────────────────── */
export function EfficiencyChart() {
  const labels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8"];

  const data = {
    labels,
    datasets: [
      {
        type: "bar" as const,
        label: "Ad Spend ($)",
        data: [4200, 5100, 4800, 6300, 7100, 6800, 7500, 8200],
        backgroundColor: "rgba(212, 175, 55, 0.25)",
        borderColor: "#d4af37",
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: "y",
        order: 2,
      },
      {
        type: "line" as const,
        label: "CAC ($)",
        data: [38, 32, 29, 25, 22, 24, 20, 18],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.08)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "#ef4444",
        pointBorderColor: "#020408",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: "y1",
        order: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: "#9ca3af", font: { size: 10 }, usePointStyle: true, pointStyleWidth: 10, padding: 16 },
      },
      tooltip: {
        backgroundColor: "rgba(2, 4, 8, 0.95)",
        borderColor: "rgba(212, 175, 55, 0.3)",
        borderWidth: 1,
        titleColor: "#d4af37",
        bodyColor: "#e5e7eb",
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#6b7280", font: { size: 10 } },
      },
      y: {
        position: "left" as const,
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#d4af37", font: { size: 10 }, callback: (v: unknown) => `$${v}` },
        title: { display: true, text: "Spend ($)", color: "#d4af37", font: { size: 9 } },
      },
      y1: {
        position: "right" as const,
        grid: { drawOnChartArea: false },
        ticks: { color: "#ef4444", font: { size: 10 }, callback: (v: unknown) => `$${v}` },
        title: { display: true, text: "CAC ($)", color: "#ef4444", font: { size: 9 } },
      },
    },
  };

  return (
    <ChartContainer title="Efficiency Curve" subtitle="Spend vs CAC — dual axis" timeToggle>
      <div className="h-[320px]">
        <Bar data={data as any} options={options} />
      </div>
    </ChartContainer>
  );
}

/* ── Audience Breakdown Chart ───────────────────────────────────── */
export function AudienceBreakdownChart() {
  const labels = ["Google Ads", "Meta Ads", "TikTok", "Email", "Direct"];

  const data = {
    labels,
    datasets: [
      {
        label: "Skimmer",
        data: [320, 280, 450, 180, 90],
        backgroundColor: "rgba(212, 175, 55, 0.7)",
        borderColor: "#d4af37",
        borderWidth: 1,
        borderRadius: 3,
      },
      {
        label: "Swimmer",
        data: [210, 190, 310, 140, 60],
        backgroundColor: "rgba(128, 107, 69, 0.7)",
        borderColor: "#806b45",
        borderWidth: 1,
        borderRadius: 3,
      },
      {
        label: "Diver",
        data: [80, 65, 120, 45, 25],
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "#3b82f6",
        borderWidth: 1,
        borderRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: "#9ca3af", font: { size: 10 }, usePointStyle: true, pointStyleWidth: 10, padding: 16 },
      },
      tooltip: {
        backgroundColor: "rgba(2, 4, 8, 0.95)",
        borderColor: "rgba(212, 175, 55, 0.3)",
        borderWidth: 1,
        titleColor: "#d4af37",
        bodyColor: "#e5e7eb",
        padding: 10,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#6b7280", font: { size: 10 } },
      },
      y: {
        stacked: true,
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#9ca3af", font: { size: 10 } },
        title: { display: true, text: "Conversions", color: "#9ca3af", font: { size: 9 } },
      },
    },
  };

  return (
    <ChartContainer title="Audience Breakdown" subtitle="Stacked by tier per channel">
      <div className="h-[300px]">
        <Bar data={data} options={options} />
      </div>
    </ChartContainer>
  );
}

/* ── Campaign Performance Line Chart ────────────────────────────── */
export function CampaignPerformanceChart({ campaigns }: { campaigns: { name: string; impressions: number | null; clicks: number | null }[] }) {
  // Use up to 8 campaigns for the chart
  const topCampaigns = campaigns.slice(0, 8);

  const data = {
    labels: topCampaigns.map((c) => c.name.length > 15 ? c.name.slice(0, 15) + "…" : c.name),
    datasets: [
      {
        label: "Impressions",
        data: topCampaigns.map((c) => c.impressions ?? 0),
        borderColor: "#d4af37",
        backgroundColor: "rgba(212, 175, 55, 0.1)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "#d4af37",
        pointBorderColor: "#020408",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: "y",
      },
      {
        label: "Clicks",
        data: topCampaigns.map((c) => c.clicks ?? 0),
        borderColor: "#806b45",
        backgroundColor: "rgba(128, 107, 69, 0.1)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "#806b45",
        pointBorderColor: "#020408",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: "#9ca3af", font: { size: 10 }, usePointStyle: true, pointStyleWidth: 10, padding: 16 },
      },
      tooltip: {
        backgroundColor: "rgba(2, 4, 8, 0.95)",
        borderColor: "rgba(212, 175, 55, 0.3)",
        borderWidth: 1,
        titleColor: "#d4af37",
        bodyColor: "#e5e7eb",
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#6b7280", font: { size: 9 }, maxRotation: 45 },
      },
      y: {
        position: "left" as const,
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#d4af37", font: { size: 10 } },
        title: { display: true, text: "Impressions", color: "#d4af37", font: { size: 9 } },
      },
      y1: {
        position: "right" as const,
        grid: { drawOnChartArea: false },
        ticks: { color: "#806b45", font: { size: 10 } },
        title: { display: true, text: "Clicks", color: "#806b45", font: { size: 9 } },
      },
    },
  };

  return (
    <ChartContainer title="Campaign Performance" subtitle="Impressions vs clicks by campaign" timeToggle>
      <div className="h-[300px]">
        <Line data={data} options={options} />
      </div>
    </ChartContainer>
  );
}
