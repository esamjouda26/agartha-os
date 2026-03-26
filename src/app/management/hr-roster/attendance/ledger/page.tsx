import LedgerClient from "./ledger-client";
import { getLedger, getDiscrepancies } from "../actions";

export default async function LedgerPage() {
  const today = new Date();
  const tOffset = today.getTimezoneOffset() * 60000;
  const localISOTime = new Date(today.getTime() - tOffset).toISOString().split("T")[0];

  const ledger = await getLedger(localISOTime, localISOTime);
  const discrepancies = await getDiscrepancies();

  return <LedgerClient initialLedger={ledger} initialDiscrepancies={discrepancies} />;
}
