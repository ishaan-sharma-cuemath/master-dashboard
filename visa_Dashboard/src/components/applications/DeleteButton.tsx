"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteApplication } from "@/lib/actions/applications";

export function DeleteButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const del = deleteApplication.bind(null, id);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="btn btn-ghost" style={{ color: "var(--health-red-text)" }}>
          <Trash2 size={15} /> Delete
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(10,12,18,0.5)" }} />
        <Dialog.Content
          className="card fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[400px] -translate-x-1/2 -translate-y-1/2 p-5"
          style={{ borderRadius: "var(--radius-dialog)" }}
        >
          <Dialog.Title className="text-[16px] font-semibold tracking-[-0.01em]">Delete application?</Dialog.Title>
          <Dialog.Description className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
            This permanently removes <span className="font-medium" style={{ color: "var(--ink)" }}>{name}</span>&rsquo;s visa
            application. This can&rsquo;t be undone.
          </Dialog.Description>
          <div className="mt-5 flex justify-end gap-2.5">
            <Dialog.Close asChild>
              <button className="btn btn-ghost">Cancel</button>
            </Dialog.Close>
            <form action={del}>
              <button type="submit" className="btn" style={{ background: "var(--health-red)", color: "#fff" }}>
                <Trash2 size={15} /> Delete
              </button>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
