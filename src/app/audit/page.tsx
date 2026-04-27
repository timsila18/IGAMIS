import { ModuleBoard } from "@/components/module-board";
import { PageFrame, PageTitle } from "@/components/page-frame";

const rows = [
  { Time: "2026-04-27 09:14", User: "auditor@igamis.go.ke", Entity: "Asset", Action: "VERIFY", Result: "12 ICT assets flagged" },
  { Time: "2026-04-27 09:42", User: "fleet@igamis.go.ke", Entity: "Fleet", Action: "UPDATE_FUEL_LOG", Result: "Fuel anomaly detected" },
  { Time: "2026-04-27 10:05", User: "treasury.admin@igamis.go.ke", Entity: "Transfer", Action: "APPROVE", Result: "Transfer TR-2026-00019 approved" },
];

export default function AuditPage() {
  return (
    <PageFrame>
      <PageTitle
        eyebrow="Audit and compliance"
        title="Evidence-grade change history"
        description="Who changed what, missing asset reports, expired insurance, unassigned assets and ghost asset detection signals."
      />
      <ModuleBoard
        title="Audit trail"
        description="Immutable audit events are written through server-side mutation paths."
        stats={[
          { label: "Events today", value: rows.length },
          { label: "Missing assets", value: 0 },
          { label: "Expired insurance", value: 1, tone: "red" },
          { label: "Unassigned", value: 1, tone: "gold" },
        ]}
        rows={rows}
      />
    </PageFrame>
  );
}
