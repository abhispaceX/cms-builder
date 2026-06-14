import { getSession } from "@/lib/auth/session";
import { SEEDED_USERS } from "@/lib/auth/users";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

type SP = Promise<{ next?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const { next } = await searchParams;
  const session = await getSession();

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12"
    >
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mock auth — pick a role to continue.
        </p>
      </header>

      {session ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Already signed in as{" "}
          <strong>{session.username}</strong> ({session.role}).
        </p>
      ) : null}

      <LoginForm users={SEEDED_USERS} next={next ?? "/"} />
    </main>
  );
}
