import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-copy">
          <p className="eyebrow">Admin Access</p>
          <h1>Weekly Creator Payout Portal</h1>
          <p>
            Track YouTube Shorts, calculate weekly payouts automatically, and give accounting a clean place to close
            the loop.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
