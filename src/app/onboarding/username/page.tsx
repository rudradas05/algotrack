"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type UsernameStatus =
  | "idle"
  | "too_short"
  | "invalid"
  | "checking"
  | "available"
  | "taken";

export default function OnboardingUsernamePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const [loading, setLoading] = useState(false);

  const checkUsername = useCallback(async (value: string) => {
    if (value.length < 3) {
      setStatus("too_short");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(value)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");

    try {
      const response = await axios.get(
        `/api/auth/check-username?username=${encodeURIComponent(value)}`,
      );
      setStatus(response.data.available ? "available" : "taken");
    } catch {
      setStatus("taken");
    }
  }, []);

  useEffect(() => {
    if (!username) {
      setStatus("idle");
      return;
    }

    if (username.length < 3) {
      setStatus("too_short");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setStatus("invalid");
      return;
    }

    setStatus("idle");
    const timer = setTimeout(() => {
      checkUsername(username);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  async function handleSubmit() {
    if (status !== "available") return;
    setLoading(true);

    try {
      await axios.patch("/api/auth/set-username", { username });
      toast.success("Username set successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error("Username just taken, try another");
        setStatus("taken");
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Choose your username
          </CardTitle>
          <CardDescription>
            This is permanent and will appear on your public profile and future
            leaderboards. Choose wisely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              maxLength={20}
            />
            <div className="h-5 flex items-center gap-1.5">
              {status === "too_short" && (
                <p className="text-sm text-muted-foreground">
                  Username too short
                </p>
              )}
              {status === "invalid" && (
                <p className="text-sm text-destructive">
                  Only letters, numbers, underscores allowed
                </p>
              )}
              {status === "checking" && (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Checking...</p>
                </div>
              )}
              {status === "available" && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <p className="text-sm text-green-500">Available</p>
                </div>
              )}
              {status === "taken" && (
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">Already taken</p>
                </div>
              )}
            </div>
          </div>
          <Button
            className="w-full"
            disabled={status !== "available" || loading}
            onClick={handleSubmit}
          >
            {loading ? "Setting username..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
