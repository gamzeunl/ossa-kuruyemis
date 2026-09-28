"use client";

import { useTransition } from "react";
import { signOutAction } from "@/actions/auth";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => signOutAction())}
      className="inline-flex w-fit items-center justify-center rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Çıkış yapılıyor…" : "Çıkış yap"}
    </button>
  );
}
