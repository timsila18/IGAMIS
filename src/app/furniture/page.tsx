import { ModuleBoard } from "@/components/module-board";
import { PageFrame, PageTitle } from "@/components/page-frame";

const rows = [
  { Asset: "JUD-FUR-2021-0221", Type: "Filing cabinets", Assignment: "Milimani Registry", Movement: "3 movements", Repair: "Raised", Disposal: "Ready" },
  { Asset: "TNT-FUR-2024-0088", Type: "Executive desks", Assignment: "Budget Directorate", Movement: "1 movement", Repair: "None", Disposal: "No" },
  { Asset: "MOE-FUR-2023-0412", Type: "Safes", Assignment: "Exams Council liaison", Movement: "0 movements", Repair: "Inspection", Disposal: "No" },
];

export default function FurniturePage() {
  return (
    <PageFrame>
      <PageTitle
        eyebrow="Furniture and office equipment"
        title="Office equipment custody and movement"
        description="Desks, chairs, cabinets, safes and filing shelves with employee assignment, movement history, repair requests and disposal readiness."
      />
      <ModuleBoard
        title="Furniture register"
        description="Office asset custody and disposal indicators."
        stats={[
          { label: "Records", value: rows.length },
          { label: "Repair requests", value: 2, tone: "gold" },
          { label: "Ready disposal", value: 1, tone: "red" },
          { label: "Assigned", value: "100%" },
        ]}
        rows={rows}
      />
    </PageFrame>
  );
}
