"use client"

import { useUser } from "@/hooks/use-user"
import { SignInButton } from "./SignInButton"
import { SignOutButton } from "./SignOutButton"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu() {
    const { user, loading } = useUser()

    if (loading) {
        return null
    }

    if (!user) {
        return <SignInButton />
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-zinc-800">
                <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center">
                    {user.email?.[0].toUpperCase()}
                </div>
                <span className="text-sm text-zinc-400">{user.email}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800">
                <DropdownMenuItem className="focus:bg-zinc-800 w-full">
                    <SignOutButton />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 