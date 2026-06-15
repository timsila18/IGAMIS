import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addConstructionProject, listHousingProjects } from "@/lib/housing-repository";
import { formatDatabaseError } from "@/lib/db-errors";

export async function GET() {
  const user = await getSessionUser();
  const data = await listHousingProjects(user);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const project = await addConstructionProject(await request.json(), user);
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}
