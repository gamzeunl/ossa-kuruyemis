"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { signUpAction } from "@/actions/auth";
import { signUpSchema } from "@/lib/auth-schemas";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import { FormError } from "@/components/ui/form-error";
import {
  fieldErrorClassName,
  inputClassName,
  labelClassName,
  submitButtonClassName,
} from "@/components/ui/form-styles";

const formSchema = signUpSchema
  .omit({ redirectTo: true })
  .extend({ passwordConfirmation: z.string() })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Parolalar eşleşmiyor.",
  });

type FieldErrors = Partial<
  Record<"firstName" | "lastName" | "email" | "password" | "passwordConfirmation", string>
>;

interface FormState {
  fieldErrors: FieldErrors;
  formError: string | null;
}

const initialState: FormState = { fieldErrors: {}, formError: null };

export function SignUpForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const raw = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      passwordConfirmation: String(formData.get("passwordConfirmation") ?? ""),
    };

    const parsed = formSchema.safeParse(raw);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      return {
        fieldErrors: {
          firstName: flattened.firstName?.[0],
          lastName: flattened.lastName?.[0],
          email: flattened.email?.[0],
          password: flattened.password?.[0],
          passwordConfirmation: flattened.passwordConfirmation?.[0],
        },
        formError: null,
      };
    }

    const result = await signUpAction({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
    });

    if (!result.ok) {
      return { fieldErrors: {}, formError: result.message };
    }

    router.replace(sanitizeRedirectPath(redirectTo ?? "/hesabim"));
    return { fieldErrors: {}, formError: null };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <FormError message={state.formError} />

      <div className="flex flex-col gap-1">
        <label htmlFor="firstName" className={labelClassName}>
          Ad
        </label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          autoComplete="given-name"
          required
          aria-invalid={Boolean(state.fieldErrors.firstName)}
          aria-describedby={state.fieldErrors.firstName ? "firstName-error" : undefined}
          className={inputClassName(Boolean(state.fieldErrors.firstName))}
        />
        {state.fieldErrors.firstName ? (
          <p id="firstName-error" className={fieldErrorClassName}>
            {state.fieldErrors.firstName}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lastName" className={labelClassName}>
          Soyad
        </label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          autoComplete="family-name"
          required
          aria-invalid={Boolean(state.fieldErrors.lastName)}
          aria-describedby={state.fieldErrors.lastName ? "lastName-error" : undefined}
          className={inputClassName(Boolean(state.fieldErrors.lastName))}
        />
        {state.fieldErrors.lastName ? (
          <p id="lastName-error" className={fieldErrorClassName}>
            {state.fieldErrors.lastName}
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
          required
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

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClassName}>
          Parola
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state.fieldErrors.password)}
          aria-describedby={state.fieldErrors.password ? "password-error" : undefined}
          className={inputClassName(Boolean(state.fieldErrors.password))}
        />
        {state.fieldErrors.password ? (
          <p id="password-error" className={fieldErrorClassName}>
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="passwordConfirmation" className={labelClassName}>
          Parola Tekrarı
        </label>
        <input
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state.fieldErrors.passwordConfirmation)}
          aria-describedby={
            state.fieldErrors.passwordConfirmation ? "passwordConfirmation-error" : undefined
          }
          className={inputClassName(Boolean(state.fieldErrors.passwordConfirmation))}
        />
        {state.fieldErrors.passwordConfirmation ? (
          <p id="passwordConfirmation-error" className={fieldErrorClassName}>
            {state.fieldErrors.passwordConfirmation}
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={isPending} className={submitButtonClassName}>
        {isPending ? "Hesap oluşturuluyor…" : "Hesap Oluştur"}
      </button>
    </form>
  );
}
