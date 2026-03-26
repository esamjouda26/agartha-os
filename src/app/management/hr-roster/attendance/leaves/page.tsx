import LeavesClient from "./leaves-client";
import { getLeaves } from "../actions";

export default async function LeavesPage() {
  const leaves = await getLeaves();
  return <LeavesClient initialLeaves={leaves} />;
}
