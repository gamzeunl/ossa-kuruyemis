"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileSettingsActionResult } from "@/actions/account-settings";
import { inputClassName, labelClassName, submitButtonClassName } from "@/components/ui/form-styles";

interface ProfileSettingsFormProps {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export function ProfileSettingsForm({ email, firstName, lastName, phone }: ProfileSettingsFormProps) {
  const [state, formAction, isPending] = useActionState<ProfileSettingsActionResult | null, FormData>(
    async (_prevState, formData) => updateProfileAction(formData),
    null,
  );

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state?.ok === false ? (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </div>
      ) : null}
      {state?.ok === true ? (
        <div role="status" className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          Profil bilgileriniz güncellendi.
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClassName}>
          E-posta
        </label>
        <input
          id="email"
          type="email"
          value={email}
          disabled
          readOnly
          className={`${inputClassName(false)} bg-surface-muted text-foreground/60 cursor-not-allowed`}
        />
        <p className="text-foreground/40 text-xs">E-posta adresiniz şu an bu ekrandan değiştirilemiyor.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className={labelClassName}>
            Ad
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            defaultValue={firstName}
            className={inputClassName(false)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className={labelClassName}>
            Soyad
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            defaultValue={lastName}
            className={inputClassName(false)}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="phone" className={labelClassName}>
            Telefon <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="05XX XXX XX XX"
            autoComplete="tel"
            defaultValue={phone}
            className={inputClassName(false)}
          />
        </div>
      </div>

      <button type="submit" disabled={isPending} className={`${submitButtonClassName} w-fit`}>
        {isPending ? "Kaydediliyor…" : "Bilgileri Kaydet"}
      </button>
    </form>
  );
}
