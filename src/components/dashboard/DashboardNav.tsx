"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, ListTodo, LogOut } from "lucide-react";

interface DashboardNavProps {
  username: string;
  image?: string | null;
}

export function DashboardNav({ username, image }: DashboardNavProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="text-lg font-bold sm:text-xl">
          Algo<span className="gradient-title">Track</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/dashboard"
            className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/problems"
            className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
          >
            <ListTodo className="h-4 w-4" />
            All Problems
          </Link>

          <Link href="/profile">
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={image || undefined} alt={username} />
              <AvatarFallback>
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </nav>
      </div>
    </header>
  );
}
