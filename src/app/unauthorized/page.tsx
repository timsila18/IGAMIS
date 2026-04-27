import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 p-6 dark:bg-black">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-lg bg-red-700 text-white">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle>Unauthorized</CardTitle>
          <CardDescription>Your role does not have access to this IGAMIS module.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard"><Button>Return to dashboard</Button></Link>
        </CardContent>
      </Card>
    </main>
  );
}
