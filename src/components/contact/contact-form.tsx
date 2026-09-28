"use client";

import { useActionState, useState } from "react";
import { submitContactRequestAction } from "@/actions/contact";
import {
  CONTACT_REQUEST_TYPE_OPTIONS,
  getContactRequestTypeOption,
  type ContactRequestTypeValue,
} from "@/lib/contact-content";
import { contactFormSchema } from "@/lib/contact-schema";

type FieldName =
  "name" | "phone" | "email" | "requestType" | "eventDate" | "estimatedGuestCount" | "message";

type FieldErrors = Partial<Record<FieldName, string>>;

interface FormState {
  fieldErrors: FieldErrors;
  formError: string | null;
  success: boolean;
}

const initialState: FormState = { fieldErrors: {}, formError: null, success: false };

const labelClassName = "text-foreground text-sm font-medium";

function inputClassName(invalid: boolean): string {
  return [
    "border-border-muted focus:border-brand w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors",
    invalid ? "border-red-400 focus:border-red-500" : "",
  ]
    .join(" ")
    .trim();
}

const fieldErrorClassName = "text-xs font-medium text-red-600";

export function ContactForm({
  defaultRequestType,
}: {
  defaultRequestType: ContactRequestTypeValue | null;
}) {
  const [requestType, setRequestType] = useState<ContactRequestTypeValue>(
    defaultRequestType ?? "GENERAL_INFO",
  );
  const showEventFields = getContactRequestTypeOption(requestType)?.isEventRelated ?? false;

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const website = String(formData.get("website") ?? "");

    const raw = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? "").trim() || undefined,
      requestType: String(formData.get("requestType") ?? ""),
      eventDate: String(formData.get("eventDate") ?? "").trim() || undefined,
      estimatedGuestCount: String(formData.get("estimatedGuestCount") ?? "").trim() || undefined,
      message: String(formData.get("message") ?? ""),
    };

    const parsed = contactFormSchema.safeParse(raw);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      return {
        fieldErrors: {
          name: flattened.name?.[0],
          phone: flattened.phone?.[0],
          email: flattened.email?.[0],
          requestType: flattened.requestType?.[0],
          eventDate: flattened.eventDate?.[0],
          estimatedGuestCount: flattened.estimatedGuestCount?.[0],
          message: flattened.message?.[0],
        },
        formError: null,
        success: false,
      };
    }

    const result = await submitContactRequestAction({ ...parsed.data, website });

    if (!result.ok) {
      return { fieldErrors: {}, formError: result.message, success: false };
    }

    return { fieldErrors: {}, formError: null, success: true };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  if (state.success) {
    return (
      <div
        role="status"
        className="border-border-muted bg-surface flex flex-col gap-2 rounded-2xl border p-8 text-center"
      >
        <p className="text-foreground text-lg font-bold">
          Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4"
      
    >
      {/* Honeypot: gerçek kullanıcılar görmez/doldurmaz (görsel olarak ve ekran okuyucudan
          gizli, ama DOM'da mevcut — `display:none` yerine bu, alanı atlayan bazı botları
          da yakalar). Sunucu tarafında dolu gelirse istek sessizce reddedilir. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="website">Web siteniz</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.formError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.formError}
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className={labelClassName}>
          Ad Soyad
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Ad Soyad"
          maxLength={120}
          aria-invalid={Boolean(state.fieldErrors.name)}
          aria-describedby={state.fieldErrors.name ? "name-error" : undefined}
          className={inputClassName(Boolean(state.fieldErrors.name))}
        />
        {state.fieldErrors.name ? (
          <p id="name-error" className={fieldErrorClassName}>
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className={labelClassName}>
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="05XX XXX XX XX"
            maxLength={20}
            aria-invalid={Boolean(state.fieldErrors.phone)}
            aria-describedby={state.fieldErrors.phone ? "phone-error" : undefined}
            className={inputClassName(Boolean(state.fieldErrors.phone))}
          />
          {state.fieldErrors.phone ? (
            <p id="phone-error" className={fieldErrorClassName}>
              {state.fieldErrors.phone}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className={labelClassName}>
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ornek@eposta.com"
            maxLength={200}
            aria-invalid={Boolean(state.fieldErrors.email)}
            aria-describedby={state.fieldErrors.email ? "email-error" : undefined}
            className={inputClassName(Boolean(state.fieldErrors.email))}
          />
          {state.fieldErrors.email ? (
            <p id="email-error" className={fieldErrorClassName}>
              {state.fieldErrors.email}
            </p>
          ) : null}
        </div>
      </div>
      <p className="text-foreground/50 -mt-3 text-xs">
        Telefon veya e-postadan en az birini girin.
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="requestType" className={labelClassName}>
          Talep Türü
        </label>
        <select
          id="requestType"
          name="requestType"
          required
          value={requestType}
          onChange={(event) => setRequestType(event.target.value as ContactRequestTypeValue)}
          aria-invalid={Boolean(state.fieldErrors.requestType)}
          aria-describedby={state.fieldErrors.requestType ? "requestType-error" : undefined}
          className={inputClassName(Boolean(state.fieldErrors.requestType))}
        >
          {CONTACT_REQUEST_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {state.fieldErrors.requestType ? (
          <p id="requestType-error" className={fieldErrorClassName}>
            {state.fieldErrors.requestType}
          </p>
        ) : null}
      </div>

      {showEventFields ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="eventDate" className={labelClassName}>
              Etkinlik Tarihi <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
            </label>
            <input
              id="eventDate"
              name="eventDate"
              type="date"
              aria-invalid={Boolean(state.fieldErrors.eventDate)}
              aria-describedby={state.fieldErrors.eventDate ? "eventDate-error" : undefined}
              className={inputClassName(Boolean(state.fieldErrors.eventDate))}
            />
            {state.fieldErrors.eventDate ? (
              <p id="eventDate-error" className={fieldErrorClassName}>
                {state.fieldErrors.eventDate}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="estimatedGuestCount" className={labelClassName}>
              Tahmini Kişi Sayısı{" "}
              <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
            </label>
            <input
              id="estimatedGuestCount"
              name="estimatedGuestCount"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="ör. 150"
              aria-invalid={Boolean(state.fieldErrors.estimatedGuestCount)}
              aria-describedby={
                state.fieldErrors.estimatedGuestCount ? "estimatedGuestCount-error" : undefined
              }
              className={inputClassName(Boolean(state.fieldErrors.estimatedGuestCount))}
            />
            {state.fieldErrors.estimatedGuestCount ? (
              <p id="estimatedGuestCount-error" className={fieldErrorClassName}>
                {state.fieldErrors.estimatedGuestCount}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className={labelClassName}>
          Mesaj
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          maxLength={2000}
          placeholder="Etkinliğiniz ve ihtiyacınız hakkında kısaca bilgi verin."
          aria-invalid={Boolean(state.fieldErrors.message)}
          aria-describedby={state.fieldErrors.message ? "message-error" : undefined}
          className={inputClassName(Boolean(state.fieldErrors.message))}
        />
        {state.fieldErrors.message ? (
          <p id="message-error" className={fieldErrorClassName}>
            {state.fieldErrors.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand hover:bg-brand-dark mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg px-7 text-sm font-bold text-brand-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Gönderiliyor…" : "Talebi Gönder"}
      </button>
    </form>
  );
}
