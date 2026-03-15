"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface RetryNotesModalProps {
  problemId: string;
  currentNeedRetry: boolean;
  currentNotes: string;
  onUpdate: (data: { needsRetry: boolean; retryNotes: string }) => void;
  isSaving?: boolean;
}

export function RetryNotesModal({
  problemId,
  currentNeedRetry,
  currentNotes,
  onUpdate,
  isSaving = false,
}: RetryNotesModalProps) {
  const [open, setOpen] = useState(false);
  const [needRetry, setNeedRetry] = useState(currentNeedRetry);
  const [notes, setNotes] = useState(currentNotes);

  const handleSave = () => {
    onUpdate({ needsRetry: needRetry, retryNotes: notes });
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setNeedRetry(currentNeedRetry);
      setNotes(currentNotes);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={currentNeedRetry}
          onCheckedChange={() => setOpen(true)}
          className="cursor-pointer"
        />
      </div>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark for Retry</DialogTitle>
          <DialogDescription>
            Update whether you need to retry this problem and add notes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="need-retry"
              checked={needRetry}
              onCheckedChange={(checked) => setNeedRetry(checked as boolean)}
            />
            <Label htmlFor="need-retry" className="font-medium cursor-pointer">
              Need to retry this problem
            </Label>
          </div>

          {needRetry && (
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Why do you need to retry? What should you work on?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                {notes.length}/500
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
