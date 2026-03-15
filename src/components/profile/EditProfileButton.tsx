"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function EditProfileButton() {
  return (
    <Button variant="outline" onClick={() => toast.info("Coming soon!")}>
      Edit Profile
    </Button>
  );
}
