"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  ListTodo,
  LogOut,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardNavProps {
  username: string;
  image?: string | null;
}

export function DashboardNav({ username, image }: DashboardNavProps) {
  const [syncing, setSyncing] = useState(false);

  async function handleSyncSheet() {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync-sheet", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.details || data.error || "Sync failed");
        return;
      }

      if (data.synced > 0) {
        toast.success(`Synced ${data.synced} problem(s) to Google Sheet`);
      } else {
        toast.info("All problems already in Google Sheet");
      }
    } catch {
      toast.error("Failed to sync to Google Sheet");
    } finally {
      setSyncing(false);
    }
  }

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

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={syncing}
            onClick={handleSyncSheet}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {syncing ? "Syncing..." : "Sync Sheet"}
            </span>
          </Button>

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
