"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { SeededUser } from "@/lib/auth/users";

export function LoginForm({
  users,
  next,
}: {
  users: SeededUser[];
  next: string;
}) {
  const router = useRouter();
  const [username, setUsername] = React.useState(users[0]?.username ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Sign-in failed.");
        return;
      }
      router.push(next || "/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Role</legend>
        {users.map((u) => (
          <div key={u.username} className="flex items-start gap-2">
            <input
              id={`role-${u.username}`}
              type="radio"
              name="username"
              value={u.username}
              checked={username === u.username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
            />
            <Label htmlFor={`role-${u.username}`} className="cursor-pointer">
              <span className="block font-medium">{u.label}</span>
              <span className="block font-mono text-xs text-muted-foreground">
                {u.username}
              </span>
            </Label>
          </div>
        ))}
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
