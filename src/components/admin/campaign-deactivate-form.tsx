"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import type { AdminActionResult } from "@/actions/admin-marketing-campaigns";

interface FormState {
  message: string | null;
}

const initialState: FormState = { message: null };

/** Kampanyayı silmeden hızlıca `isActive=false` yapar — ayrı `CAMPAIGN_DEACTIVATED` audit kaydı bırakır. */
export function CampaignDeactivateForm({ action }: { action: () => Promise<AdminActionResult> }) {
  const router = useRouter();

  async function handleAction(): Promise<FormState> {
    const result = await action();
    if (result.ok) {
      router.refresh();
      return { message: null };
    }
    return { message: result.message };
  }

  const [state, formAction, isPending] = useActionState(handleAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      {state.message ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        onClick={(event) => {
          if (!window.confirm("Bu kampanyayı pasifleştirmek istediğinize emin misiniz?")) {
            event.preventDefault();
          }
        }}
        className="border-border-muted text-foreground/70 hover:bg-surface-muted min-h-10 rounded-full border px-5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Pasifleştiriliyor…" : "Pasifleştir"}
      </button>
    </form>
  );
}
