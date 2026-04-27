import { Inbox } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-800">
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-900">
        <Inbox className="h-6 w-6" />
      </div>
      <div className="mt-4 font-semibold">{title}</div>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
    </div>
  );
}
