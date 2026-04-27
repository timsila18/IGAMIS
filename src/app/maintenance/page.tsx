import { ModuleBoard } from "@/components/module-board";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { formatKes } from "@/data/demo";

const rows = [
  { Request: "MR-2026-00041", Asset: "KWS-VEH-2022-0142", Priority: "High", Status: "IN_PROGRESS", Vendor: "CFAO Motors", Budget: formatKes(420000) },
  { Request: "MR-2026-00042", Asset: "KFS-CMP-044", Priority: "Medium", Status: "BUDGET_REVIEW", Vendor: "Public Works", Budget: formatKes(1800000) },
  { Request: "MR-2026-00043", Asset: "JUD-FUR-2021-0221", Priority: "Low", Status: "RAISED", Vendor: "Internal workshop", Budget: formatKes(90000) },
];

export default function MaintenancePage() {
  return (
    <PageFrame>
      <PageTitle
        eyebrow="Maintenance workflow"
        title="Repair requests and work orders"
        description="Raise requests, assign technicians, approve budgets, close work orders, track cost and retain vendor history."
      />
      <ModuleBoard
        title="Open work orders"
        description="Budget and technician workflow queue."
        stats={[
          { label: "Open", value: rows.length, tone: "gold" },
          { label: "High priority", value: 1, tone: "red" },
          { label: "Budget exposure", value: formatKes(2310000) },
          { label: "Closed this quarter", value: 28 },
        ]}
        rows={rows}
      />
    </PageFrame>
  );
}
