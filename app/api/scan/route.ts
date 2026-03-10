import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import { scanDomain } from "@/lib/scanner";
import { NextResponse } from "next/server";

const FREE_SCAN_LIMIT = 3;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    const formData = await req.formData();
    const urlMatch = formData.get("url") as string;

    if (!urlMatch) {
      return new NextResponse("URL is required", { status: 400 });
    }

    const domainUrl = urlMatch.startsWith("http")
      ? urlMatch
      : `https://${urlMatch}`;

    // Ensure the Supabase user exists in the Prisma User table (FK guard)
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email!,
        name: user.user_metadata?.full_name ?? null,
        image: user.user_metadata?.avatar_url ?? null,
      },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name ?? null,
        image: user.user_metadata?.avatar_url ?? null,
      },
    });

    // Enforce free tier scan limit
    if (dbUser.subscriptionPlan === "free") {
      const scanCount = await prisma.domainReport.count({
        where: { userId: user.id },
      });
      if (scanCount >= FREE_SCAN_LIMIT) {
        return NextResponse.redirect(
          new URL("/pricing?limit=reached", req.url),
          { status: 303 }
        );
      }
    }

    // Perform the scan
    const report = await scanDomain(domainUrl);

    // Save report to database
    const savedReport = await prisma.domainReport.create({
      data: {
        userId: user.id,
        domainUrl: domainUrl,
        score: report.score,
        reportData: JSON.stringify(report),
      },
    });

    // Redirect to report view
    return NextResponse.redirect(
      new URL(`/dashboard/report/${savedReport.id}`, req.url),
      {
        status: 303, // See Other (forces GET instead of POST on redirect)
      }
    );
  } catch (error) {
    console.error("Scan error:", error);
    return new NextResponse("Failed to scan domain. Please try again later.", {
      status: 500,
    });
  }
}
