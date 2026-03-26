import { redirect } from "next/navigation";

export default function AttendanceIndex() {
  redirect("/management/hr-roster/attendance/ledger");
}
