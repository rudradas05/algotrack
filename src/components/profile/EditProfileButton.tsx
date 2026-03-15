"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function EditProfileButton() {
  return (
    <Button
      variant="outline"
      className="rounded-full border-primary/30 bg-primary/5 hover:bg-primary/10"
      onClick={() => toast.info("Coming soon!")}
    >
      Edit Profile
    </Button>
  );
}
