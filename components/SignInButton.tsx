"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

export function SignInButton() {
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    async function signInWithGoogle() {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                throw error
            }
        } catch (error) {
            console.error("Error signing in with Google:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="bg-zinc-800 hover:bg-zinc-700 text-white"
        >
            {isLoading ? "Signing in..." : "Sign in with Google"}
        </Button>
    )
} 