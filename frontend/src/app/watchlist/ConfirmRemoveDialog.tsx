"use client";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = { onConfirm: () => void; children: React.ReactNode };

export default function ConfirmRemoveDialog({ onConfirm, children }: Props) {
  // {/* Confirm Remove */}
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove skin?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the skin from your watchlist.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Usage example:
// <ConfirmRemoveDialog onConfirm={() => handleRemove(id)}>
//   <Button variant="outline">Remove</Button>
// </ConfirmRemoveDialog>
