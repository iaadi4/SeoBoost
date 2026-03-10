"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
    const router = useRouter();
    
    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.refresh(); // refresh the current route to lose session data
    };

    return (
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground transition-colors" onClick={handleSignOut}>
            Sign Out <LogOut className="ml-2 h-4 w-4" />
        </Button>
    );
}
