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
import { cn } from "@/lib/utils";

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
  const retryLabel = currentNeedRetry ? "Needs retry" : "No retry";
  const retryHint = currentNeedRetry
    ? hasNotePreview
      ? "Open to update your retry note"
      : "Add a note for the next attempt"
    : "Mark this problem for another pass";

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
        className="w-full max-w-[220px]"
      >
        <button
          type="button"
          onClick={() => handleOpenChange(true)}
          disabled={isSaving}
          className={cn(
            "flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-2.5 text-left shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md disabled:pointer-events-none disabled:opacity-50",
            currentNeedRetry
              ? "border-orange-200/80 bg-orange-500/5 hover:border-orange-300 hover:bg-orange-500/10 dark:border-orange-500/30 dark:hover:border-orange-500/50"
              : "border-border/70 bg-background/60 hover:border-border hover:bg-muted/40",
          )}
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              className={cn(
                "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                currentNeedRetry
                  ? "border-orange-300/90 bg-orange-500/10 text-orange-600 dark:border-orange-500/40 dark:text-orange-400"
                  : "border-border/80 bg-muted/40 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  currentNeedRetry ? "bg-current" : "bg-current/45",
                )}
              />
            </span>

            <span className="min-w-0">
              <span className="block text-xs font-semibold text-foreground">
                {retryLabel}
              </span>
              <span className="block text-[11px] leading-4 text-muted-foreground">
                {retryHint}
              </span>
            </span>
          </div>

          <span className="shrink-0 pt-0.5 text-[11px] font-medium text-primary">
            {currentNeedRetry ? "Edit" : "Add"}
          </span>
        </button>

        {currentNeedRetry && (
          <div className="group/note relative mt-1.5">
            <button
              type="button"
              onClick={() => handleOpenChange(true)}
              disabled={isSaving}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/35 px-2.5 py-1.5 text-left text-[11px] leading-4 text-muted-foreground transition-all duration-150 hover:-translate-y-px hover:border-border hover:bg-muted/55 hover:text-foreground hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
              title={hasNotePreview ? notePreview : "No retry note added yet"}
            >
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
              <span className="min-w-0 truncate">
                {hasNotePreview ? notePreview : "No retry note added yet"}
              </span>
            </button>

            {hasNotePreview && (
              <div className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-[260px] translate-y-1 rounded-xl border border-border/80 bg-popover/95 p-3 text-xs text-popover-foreground opacity-0 shadow-lg shadow-black/5 transition-all duration-150 group-hover/note:translate-y-0 group-hover/note:opacity-100 group-focus-within/note:translate-y-0 group-focus-within/note:opacity-100">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Retry note
                </p>
                <p className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words leading-5">
                  {notePreview}
                </p>
              </div>
            )}
          </div>
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
