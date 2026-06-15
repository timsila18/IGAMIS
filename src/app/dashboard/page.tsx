import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function DashboardIndexPage() {
  const user = await requireUser();
  if (user.role === "EMPLOYEE_USER") redirect("/dashboard/my-assets");
  if (["NATIONAL_TREASURY_SUPER_ADMIN", "AUDITOR", "READ_ONLY_INSPECTOR"].includes(user.role)) redirect("/dashboard/national");
  redirect("/dashboard/institution");
}
