"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SignOutButton() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    async function handleSignOut() {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                throw error
            }
            router.push("/signin")
            router.refresh()
        } catch (error) {
            console.error("Error signing out:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
        >
            {isLoading ? "Signing out..." : "Sign out"}
        </Button>
    )
} 