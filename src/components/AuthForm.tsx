"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { api } from "@/lib/client";
import type { PublicUser } from "@/lib/types";
import { useAction } from "@/lib/useAction";
import { InlineError } from "@/components/ui";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { signIn } = useSession();
  const { pending, error, run } = useAction();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isLogin = mode === "login";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await run(() =>
      api<{ user: PublicUser }>("POST", `/api/auth/${mode}`, { email, password }),
    );
    if (result) {
      signIn(result.user);
      router.replace("/");
    }
  };

  return (
    <form className="auth-card" onSubmit={onSubmit} noValidate>
      <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>
      <p className="muted">
        {isLogin ? "Sign in to see your favourites and watchlist." : "Rate films, build a watchlist and get recommendations."}
      </p>

      <label className="field">
        <span className="label">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
        />
      </label>

      <label className="field">
        <span className="label">Password</span>
        <input
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
        />
        {!isLogin && <span className="hint">At least 8 characters.</span>}
      </label>

      <InlineError message={error} />

      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
        {pending ? (isLogin ? "Signing in…" : "Creating account…") : isLogin ? "Sign in" : "Create account"}
      </button>

      <p className="muted auth-switch">
        {isLogin ? (
          <>
            New here? <Link href="/register">Create an account</Link>
          </>
        ) : (
          <>
            Already have an account? <Link href="/login">Sign in</Link>
          </>
        )}
      </p>
    </form>
  );
}
