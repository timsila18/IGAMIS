import { getPrisma, hasDatabaseUrl } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type AuditInput = {
  actorId?: string | null;
  action: string;
  module: string;
  recordId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  assetId?: string | null;
};

export async function writeAuditLog(input: AuditInput) {
  if (!hasDatabaseUrl()) return null;

  const prisma = getPrisma();
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      module: input.module,
      recordId: input.recordId,
      oldValue: input.oldValue === undefined ? undefined : input.oldValue === null ? Prisma.JsonNull : (input.oldValue as Prisma.InputJsonValue),
      newValue: input.newValue === undefined ? undefined : input.newValue === null ? Prisma.JsonNull : (input.newValue as Prisma.InputJsonValue),
      ipAddress: input.ipAddress ?? "0.0.0.0",
      userAgent: input.userAgent,
      assetId: input.assetId ?? null,
    },
  });
}
