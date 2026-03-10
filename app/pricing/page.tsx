"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PricingPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribe = async (priceId: string) => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Payment failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <Zap className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">SEO Boost</span>
                    </Link>
                    <nav className="flex items-center gap-6">
                        <Link href="/dashboard">
                            <Button variant="ghost">Dashboard</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 sm:px-8 py-20">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">Simple, transparent pricing</h1>
                    <p className="text-xl text-muted-foreground">Unlock your site&apos;s full potential with unlimited scans and advanced analytics.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <Card className="flex flex-col border-border/50">
                        <CardHeader>
                            <CardTitle className="text-2xl">Hobby</CardTitle>
                            <CardDescription>Perfect for personal projects</CardDescription>
                            <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                                $0
                                <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span>3 Scans per day</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span>Basic SEO Score</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span>Title & Meta tag checks</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Link href="/dashboard" className="w-full">
                                <Button className="w-full" variant="outline" size="lg">Current Plan</Button>
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Pro Plan */}
                    <Card className="flex flex-col border-primary shadow-lg shadow-primary/10 relative">
                        <div className="absolute -top-4 left-0 right-0 flex justify-center">
                            <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                                Most Popular
                            </span>
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl">Pro</CardTitle>
                            <CardDescription>For serious creators and businesses</CardDescription>
                            <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                                $15
                                <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span className="font-medium">Unlimited Scans</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span>Advanced internal linking analysis</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span>Image optimization insights</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    <span>Export reports to PDF</span>
                                </li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className="w-full" 
                                size="lg" 
                                onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_123456")}
                                disabled={isLoading}
                            >
                                {isLoading ? "Processing..." : "Upgrade to Pro"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
