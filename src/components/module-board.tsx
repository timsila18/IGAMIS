import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export function ModuleBoard({
  title,
  description,
  stats,
  rows,
}: {
  title: string;
  description: string;
  stats: { label: string; value: string | number; tone?: "green" | "gold" | "red" | "neutral" }[];
  rows: Record<string, string | number>[];
}) {
  const columns = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <Badge tone={stat.tone ?? "green"}>{stat.label}</Badge>
              <div className="mt-4 text-3xl font-black tracking-normal">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  {columns.map((column) => <TH key={column}>{column}</TH>)}
                </TR>
              </THead>
              <TBody>
                {rows.map((row, index) => (
                  <TR key={index}>
                    {columns.map((column) => <TD key={column}>{row[column]}</TD>)}
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
