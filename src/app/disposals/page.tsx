import { ModuleBoard } from "@/components/module-board";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { formatKes } from "@/data/demo";

const rows = [
  { Disposal: "DP-2026-00009", Asset: "JUD-FUR-2021-0221", Stage: "BOARD_OF_SURVEY", Reserve: formatKes(120000), Approval: "Pending" },
  { Disposal: "DP-2026-00010", Asset: "KWS-VEH-2016-0081", Stage: "AUCTION", Reserve: formatKes(620000), Approval: "Approved" },
  { Disposal: "DP-2026-00011", Asset: "MOE-ICT-2019-1132", Stage: "WRITE_OFF_APPROVED", Reserve: formatKes(0), Approval: "Approved" },
];

export default function DisposalsPage() {
  return (
    <PageFrame>
      <PageTitle
        eyebrow="Disposal module"
        title="Condemnation, survey boards and auction workflows"
        description="Manage condemned assets, inspection reports, board of survey references, auction workflows, sold assets and write-off approvals."
      />
      <ModuleBoard
        title="Disposal pipeline"
        description="Disposal candidates and approval stages."
        stats={[
          { label: "Candidates", value: rows.length, tone: "gold" },
          { label: "At auction", value: 1 },
          { label: "Write-offs", value: 1, tone: "red" },
          { label: "Reserve value", value: formatKes(740000) },
        ]}
        rows={rows}
      />
    </PageFrame>
  );
}
