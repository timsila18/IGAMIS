import { Prisma } from "@prisma/client";

export function formatDatabaseError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return "A record with the same unique value already exists.";
    if (error.code === "P2025") return "The requested record was not found.";
    return `Database request failed (${error.code}).`;
  }

  if (error instanceof Error) return error.message;
  return "Unexpected database error.";
}
