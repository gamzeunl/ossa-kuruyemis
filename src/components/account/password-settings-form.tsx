"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { inputClassName, labelClassName, submitButtonClassName } from "@/components/ui/form-styles";

/**
 * Better Auth'un YERLEŞİK `changePassword` client API'si kullanılır — özel bir
 * hash/parola sistemi YOKTUR, sunucu tarafında zaten `emailAndPassword.enabled`
 * ile hazır olan `/api/auth/[...all]` catch-all bu isteği otomatik karşılar.
 */
export function PasswordSettingsForm() {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const newPasswordRepeat = String(formData.get("newPasswordRepeat") ?? "");

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Yeni şifre en az 8 karakter olmalıdır." });
      return;
    }
    if (newPassword !== newPasswordRepeat) {
      setMessage({ type: "error", text: "Yeni şifreler birbiriyle eşleşmiyor." });
      return;
    }

    setIsPending(true);
    setMessage(null);
    const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: false });
    setIsPending(false);

    if (error) {
      setMessage({ type: "error", text: error.message ?? "Şifre değiştirilemedi. Mevcut şifrenizi kontrol edin." });
      return;
    }

    setMessage({ type: "success", text: "Şifreniz başarıyla güncellendi." });
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {message ? (
        <div
          role={message.type === "error" ? "alert" : "status"}
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "error"
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-green-300 bg-green-50 text-green-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="currentPassword" className={labelClassName}>
          Mevcut Şifre
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputClassName(false)}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="newPassword" className={labelClassName}>
            Yeni Şifre
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClassName(false)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="newPasswordRepeat" className={labelClassName}>
            Yeni Şifre (Tekrar)
          </label>
          <input
            id="newPasswordRepeat"
            name="newPasswordRepeat"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClassName(false)}
          />
        </div>
      </div>

      <button type="submit" disabled={isPending} className={`${submitButtonClassName} w-fit`}>
        {isPending ? "Güncelleniyor…" : "Şifreyi Güncelle"}
      </button>
    </form>
  );
}
