import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { ArrowRight, BarChart3, Github, Sparkles } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <div className="hero-grid relative min-h-screen overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="glass-card subtle-rise relative w-full overflow-hidden rounded-3xl p-6 sm:p-10">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Automated DSA command center
              </div>

              <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Turn every
                <span className="gradient-title"> LeetCode commit </span>
                into measurable progress.
              </h1>

              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                AlgoTrack listens to your LeetHub GitHub activity, enriches each
                solve with metadata, and gives you a clean command center for
                streaks, trends, retries, and growth.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/register">
                  <Button size="lg" className="group">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border bg-white/70 p-4 backdrop-blur-sm">
                <div className="mb-2 inline-flex rounded-lg bg-blue-500/15 p-2 text-blue-600">
                  <Github className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">Webhook Automation</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pulls fresh solves directly from GitHub with no manual entry.
                </p>
              </div>

              <div className="rounded-2xl border bg-white/70 p-4 backdrop-blur-sm">
                <div className="mb-2 inline-flex rounded-lg bg-cyan-500/15 p-2 text-cyan-600">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">Actionable Analytics</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Difficulty and topic trends that reveal where to focus next.
                </p>
              </div>

              <div className="rounded-2xl border bg-white/70 p-4 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Why teams and students use AlgoTrack
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  Build consistency, identify weak spots faster, and maintain a
                  clean history of your solving journey in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
