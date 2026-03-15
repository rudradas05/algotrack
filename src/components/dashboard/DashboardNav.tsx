"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardNavProps {
  username: string;
  image?: string | null;
}

export function DashboardNav({ username, image }: DashboardNavProps) {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold">
          Algo<span className="text-primary">Track</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/problems"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            All Problems
          </Link>
          <Link
            href="/profile"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Profile
          </Link>
          <Link href="/profile">
            <Avatar className="h-8 w-8">
              <AvatarImage src={image || undefined} alt={username} />
              <AvatarFallback>
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign Out
          </Button>
        </nav>
      </div>
    </header>
  );
}
