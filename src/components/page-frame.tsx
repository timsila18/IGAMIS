import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export async function PageFrame({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}

export function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a721e]">{eyebrow}</div>
      <h1 className="mt-2 text-2xl font-black tracking-normal sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">{description}</p>
    </div>
  );
}
