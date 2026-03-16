import type { Metadata } from "next";
import CrewLayoutClient from "./crew-layout-client";

export const metadata: Metadata = {
  title: "Crew Operations — AgarthaOS",
  description: "Frontline operations: ticket scanning, F&B POS, shift check-ins.",
};

export default function CrewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CrewLayoutClient>{children}</CrewLayoutClient>;
}
