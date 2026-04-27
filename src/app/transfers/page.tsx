import { ModuleBoard } from "@/components/module-board";
import { PageFrame, PageTitle } from "@/components/page-frame";

const rows = [
  { Transfer: "TR-2026-00017", Asset: "TNT-LAP-2025-0104", From: "Budget Department", To: "Pensions Department", Status: "PENDING_APPROVAL" },
  { Transfer: "TR-2026-00018", Asset: "MOH-ICT-2025-0318", From: "Digital Health", To: "Universal Health Coverage", Status: "COMPLETED" },
  { Transfer: "TR-2026-00019", Asset: "KFS-QM-2024-0902", From: "Headquarters stores", To: "Rift Valley conservancy", Status: "APPROVED" },
];

export default function TransfersPage() {
  return (
    <PageFrame>
      <PageTitle
        eyebrow="Transfer module"
        title="Inter-ministry, department, office and user transfers"
        description="Full transfer history with approval status, custodial chain and receiving unit accountability."
      />
      <ModuleBoard
        title="Transfer queue"
        description="Movement history across institutions, departments, offices and users."
        stats={[
          { label: "Transfers", value: rows.length },
          { label: "Pending approval", value: 1, tone: "gold" },
          { label: "Completed", value: 1 },
          { label: "Rejected", value: 0 },
        ]}
        rows={rows}
      />
    </PageFrame>
  );
}
