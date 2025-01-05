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
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-2xl font-light">stack.wrld</h1>
                    <div className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-zinc-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-zinc-400">Loading...</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black" />
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-12 px-4">
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-4xl font-light tracking-tight">stack.wrld</h1>
                    <p className="text-zinc-400 text-lg">All of your tech stacks, in one place.</p>
                </div>
                <div className="flex flex-col items-center gap-8">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-zinc-300 font-medium">Get started</p>
                        <p className="text-zinc-500 text-sm">Sign in to continue to your workspace</p>
                    </div>
                    <SignInButton />
                </div>
            </div>
        </div>
    )
} 