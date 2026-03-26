import QueueClient from "./queue-client";
import { getDiscrepancies } from "../actions";

export default async function QueuePage() {
  const discrepancies = await getDiscrepancies();
  return <QueueClient initialDiscrepancies={discrepancies} />;
}
