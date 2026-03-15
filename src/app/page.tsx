import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-2xl px-4">
        <h1 className="text-5xl font-bold tracking-tight">
          Algo<span className="text-primary">Track</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Automated DSA progress tracker. Solve on LeetCode, track everywhere.
        </p>
        <p className="text-muted-foreground">
          LeetHub commits your solutions to GitHub. AlgoTrack picks them up
          automatically, fetches metadata from LeetCode, and logs everything to
          your dashboard and Google Sheets.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/login">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
