import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ScanForm } from "./scan-form";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const allReports = await prisma.domainReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const avgScore = allReports.length
    ? Math.round(allReports.reduce((a, b) => a + b.score, 0) / allReports.length)
    : 0;

  const userName = user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";

  const reportsForClient = allReports.map((r) => ({
    id: r.id,
    domainUrl: r.domainUrl,
    score: r.score,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <DashboardClient
      userName={userName}
      totalScans={allReports.length}
      avgScore={avgScore}
      recentReports={reportsForClient}
    >
      <ScanForm />
    </DashboardClient>
  );
}
