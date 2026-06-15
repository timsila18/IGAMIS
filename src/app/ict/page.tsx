import { ModuleBoard } from "@/components/module-board";
import { PageFrame, PageTitle } from "@/components/page-frame";

const rows = [
  { Asset: "MOH-ICT-2025-0318", Serial: "DL-9431-KE", Specs: "i7, 16GB, 512GB, encrypted", Assignee: "Payroll MOH-44219", Antivirus: "Healthy", Warranty: "2028-05-08" },
  { Asset: "TNT-SRV-2024-0022", Serial: "SRV-KEN-882", Specs: "Virtualization host, 128GB RAM", Assignee: "ICT Shared Services", Antivirus: "Datacenter policy", Warranty: "2027-12-11" },
  { Asset: "JUD-PRN-2023-0190", Serial: "HP-PR-812K", Specs: "Secure registry printer", Assignee: "Milimani Registry", Antivirus: "N/A", Warranty: "2026-06-21" },
];

export default function IctPage() {
  return (
    <PageFrame>
      <PageTitle
        eyebrow="ICT asset management"
        title="Digital equipment lifecycle"
        description="Laptops, desktops, printers, routers, servers, UPS devices and software licenses with replacement cycles and endpoint health."
      />
      <ModuleBoard
        title="ICT replacement cycle"
        description="Serial-numbered assets with warranty, specs, payroll assignment and endpoint protection status."
        stats={[
          { label: "Tracked ICT assets", value: rows.length },
          { label: "Healthy endpoint", value: "2/2" },
          { label: "Due replacement", value: 1, tone: "gold" },
          { label: "Encrypted", value: "100%" },
        ]}
        rows={rows}
      />
    </PageFrame>
  );
}
