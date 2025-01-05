"use client"

import { SignInButton } from "@/components/SignInButton"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SignInPage() {
    const { user, loading } = useUser()
    const router = useRouter()

    useEffect(() => {
        if (user && !loading) {
            router.push("/")
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8">
            <h1 className="text-2xl font-light">stack.wrld</h1>
            <div className="flex flex-col items-center gap-4">
                <p className="text-zinc-400">Sign in to continue</p>
                <SignInButton />
            </div>
        </div>
    )
} 