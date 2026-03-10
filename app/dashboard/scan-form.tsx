"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

export function ScanForm() {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <form 
            action="/api/scan" 
            method="POST" 
            className="flex flex-col sm:flex-row gap-3"
            onSubmit={() => setIsLoading(true)}
        >
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    name="url" 
                    placeholder="https://example.com" 
                    className="pl-10 h-12 text-base rounded-xl"
                    required 
                    type="url"
                    disabled={isLoading}
                />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 rounded-xl shrink-0" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Scanning...
                    </>
                ) : (
                    "Analyze Domain"
                )}
            </Button>
        </form>
    );
}
