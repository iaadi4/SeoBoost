import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { scanDomain } from "@/lib/scanner";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.redirect(new URL("/api/auth/signin", req.url));
        }

        const formData = await req.formData();
        const urlMatch = formData.get("url") as string;
        
        if (!urlMatch) {
            return new NextResponse("URL is required", { status: 400 });
        }

        const domainUrl = urlMatch.startsWith("http") ? urlMatch : `https://${urlMatch}`;

        // Perform the scan
        const report = await scanDomain(domainUrl);

        // Save report to database
        const savedReport = await prisma.domainReport.create({
            data: {
                userId: session.user.id,
                domainUrl: domainUrl,
                score: report.score,
                reportData: JSON.stringify(report),
            }
        });

        // Redirect to report view
        return NextResponse.redirect(new URL(`/dashboard/report/${savedReport.id}`, req.url), {
            status: 303 // See Other (forces GET instead of POST on redirect)
        });

    } catch (error) {
        console.error("Scan error:", error);
        return new NextResponse("Failed to scan domain. Please try again later.", { status: 500 });
    }
}
