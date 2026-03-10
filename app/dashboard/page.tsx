import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScanForm } from "./scan-form";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const recentReports = await prisma.domainReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Welcome back, {user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0]}
          </p>
        </div>
        {/* Subscription Badge */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Plan:</span>
          <Badge
            variant="secondary"
            className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary uppercase"
          >
            Free Trial
          </Badge>
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              Upgrade
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-10">
        <Card className="md:col-span-2 bg-gradient-to-br from-card to-card/50 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-2xl">New Scan</CardTitle>
            <CardDescription className="text-base">
              Enter any domain URL to instantly analyze its SEO performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScanForm />
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground shadow-md border-transparent flex flex-col justify-center">
          <CardHeader className="pb-4">
            <CardTitle className="text-4xl font-extrabold">
              {recentReports.length}
            </CardTitle>
            <CardDescription className="text-primary-foreground/80 text-lg">
              Total Domains Scanned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm opacity-90">
              Upgrade to PRO for unlimited daily scans and deep page analysis.
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold tracking-tight mb-6 mt-12">
        Recent Reports
      </h2>
      {recentReports.length === 0 ? (
        <div className="text-center py-20 border rounded-2xl bg-muted/30 border-dashed">
          <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            No scanned domains yet
          </h3>
          <p className="text-muted-foreground">
            Run your first scan using the input above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentReports.map((report) => (
            <Link key={report.id} href={`/dashboard/report/${report.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full flex flex-col">
                <CardHeader className="pb-3 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="truncate pr-4">
                      <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                        {new URL(report.domainUrl).hostname}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div
                      className={`shrink-0 flex items-center justify-center h-12 w-12 rounded-full font-bold text-lg ${
                        report.score >= 80
                          ? "bg-green-500/10 text-green-500"
                          : report.score >= 50
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {report.score}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
