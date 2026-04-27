import { ModuleBoard } from "@/components/module-board";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { stockItems } from "@/lib/repository";

export default function StoresPage() {
  return (
    <PageFrame>
      <PageTitle
        eyebrow="Stores and inventory"
        title="Consumables, fuel, spares and supplier ledgers"
        description="Stock in/out controls, reorder alerts, supplier records and store ledger readiness for high-throughput government stores."
      />
      <ModuleBoard
        title="Store ledger"
        description="Stock levels and reorder risk across controlled inventory classes."
        stats={[
          { label: "SKUs", value: stockItems.length },
          { label: "Reorder alerts", value: stockItems.filter((item) => item.quantity <= item.reorderLevel).length, tone: "red" },
          { label: "Fuel litres", value: stockItems.find((item) => item.type === "Fuel stock")?.quantity ?? 0, tone: "gold" },
          { label: "Suppliers", value: new Set(stockItems.map((item) => item.supplier)).size },
        ]}
        rows={stockItems.map((item) => ({
          SKU: item.sku,
          Item: item.name,
          Type: item.type,
          Quantity: item.quantity,
          Reorder: item.reorderLevel,
          Supplier: item.supplier,
        }))}
      />
    </PageFrame>
  );
}
