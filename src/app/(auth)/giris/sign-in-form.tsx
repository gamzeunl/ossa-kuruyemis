"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { signInAction } from "@/actions/auth";
import { signInSchema } from "@/lib/auth-schemas";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import { FormError } from "@/components/ui/form-error";
import {
  fieldErrorClassName,
  inputClassName,
  labelClassName,
  submitButtonClassName,
} from "@/components/ui/form-styles";

const formSchema = signInSchema.omit({ redirectTo: true });

type FieldErrors = Partial<Record<"email" | "password", string>>;

interface FormState {
  fieldErrors: FieldErrors;
  formError: string | null;
}

const initialState: FormState = { fieldErrors: {}, formError: null };

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const raw = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const parsed = formSchema.safeParse(raw);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      return {
        fieldErrors: {
          email: flattened.email?.[0],
          password: flattened.password?.[0],
        },
        formError: null,
      };
    }

    const result = await signInAction({
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
          autoComplete="current-password"
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

      <button type="submit" disabled={isPending} className={submitButtonClassName}>
        {isPending ? "Giriş yapılıyor…" : "Giriş Yap"}
      </button>
    </form>
  );
}
