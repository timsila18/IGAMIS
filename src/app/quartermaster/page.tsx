import { ModuleBoard } from "@/components/module-board";
import { PageFrame, PageTitle } from "@/components/page-frame";

const rows = [
  { Institution: "Kenya Forest Service", Item: "Forest ranger protective gear", Batch: "KFS-QM-2024-0902", Quantity: 420, Control: "Standard issue" },
  { Institution: "Kenya Wildlife Service", Item: "Protective boots", Batch: "KWS-QM-2025-0108", Quantity: 280, Control: "Controlled store" },
  { Institution: "National Police Service", Item: "Belts and controlled kit", Batch: "NPS-QM-2026-0022", Quantity: 900, Control: "Restricted" },
];

export default function QuartermasterPage() {
  return (
    <PageFrame>
      <PageTitle
        eyebrow="Quartermaster"
        title="Disciplined services controlled items"
        description="KFS, KWS, Police, Army and Prisons uniforms, boots, belts, protective gear and controlled items with issue accountability."
      />
      <ModuleBoard
        title="Controlled quartermaster stock"
        description="Disciplined institution kit and issue readiness."
        stats={[
          { label: "Batches", value: rows.length },
          { label: "Total units", value: rows.reduce((sum, row) => sum + Number(row.Quantity), 0) },
          { label: "Restricted", value: 1, tone: "red" },
          { label: "Issue ready", value: 2 },
        ]}
        rows={rows}
      />
    </PageFrame>
  );
}
