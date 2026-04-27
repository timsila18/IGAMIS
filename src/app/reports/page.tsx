import { FileDown } from "lucide-react";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const reports = [
  "Asset register by ministry",
  "Depreciation report",
  "Disposal candidates",
  "Vehicle cost report",
  "Housing occupancy report",
  "ICT replacement report",
  "Missing assets report",
  "National summary report",
];

export default function ReportsPage() {
  return (
    <PageFrame>
      <PageTitle
        eyebrow="Reporting"
        title="National asset reports"
        description="PDF, Excel and CSV-ready reporting surfaces for treasury leadership, auditors, ministries and inspectors."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reports.map((report) => (
          <Card key={report}>
            <CardHeader>
              <CardTitle className="text-sm">{report}</CardTitle>
              <CardDescription>Generated from the central asset registry and workflow tables.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button size="sm"><FileDown className="h-4 w-4" /> PDF</Button>
              <Button size="sm" variant="secondary">Excel</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageFrame>
  );
}
