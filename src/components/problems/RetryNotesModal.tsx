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
  currentNeedRetry: boolean;
  currentNotes: string | null;
  onUpdate: (data: { needsRetry: boolean; retryNotes: string }) => void;
  isSaving?: boolean;
}

export function RetryNotesModal({
  currentNeedRetry,
  currentNotes,
  onUpdate,
  isSaving = false,
}: RetryNotesModalProps) {
  const [open, setOpen] = useState(false);
  const [needRetry, setNeedRetry] = useState(currentNeedRetry);
  const [notes, setNotes] = useState(currentNotes ?? "");
  const notePreview = (currentNotes ?? "").trim();
  const hasNotePreview = notePreview.length > 0;

  const handleSave = () => {
    onUpdate({
      needsRetry: needRetry,
      retryNotes: needRetry ? notes : "",
    });
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setNeedRetry(currentNeedRetry);
      setNotes(currentNotes ?? "");
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex min-w-[170px] flex-col items-start gap-1.5"
      >
        <div className="flex items-center gap-2">
          <Checkbox
            checked={currentNeedRetry}
            onCheckedChange={() => {
              if (!isSaving) {
                handleOpenChange(true);
              }
            }}
            disabled={isSaving}
            className="cursor-pointer"
          />
          <button
            type="button"
            onClick={() => handleOpenChange(true)}
            disabled={isSaving}
            className="text-xs font-medium text-foreground transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-50"
          >
            {currentNeedRetry ? "Edit retry" : "Add retry"}
          </button>
        </div>

        {currentNeedRetry && (
          <button
            type="button"
            onClick={() => handleOpenChange(true)}
            disabled={isSaving}
            className="max-w-full text-left text-xs text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            title={hasNotePreview ? notePreview : "No retry note added yet"}
          >
            <span className="block overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {hasNotePreview ? notePreview : "No retry note added yet"}
            </span>
          </button>
        )}
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
