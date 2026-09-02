import { FormEvent, useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Opening your secure password-reset link…");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMessage("Password reset is unavailable because Supabase is not configured.");
      return;
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (data.session) {
        setReady(true);
        setMessage("");
      } else {
        setMessage(error?.message || "This reset link is invalid or has expired. Request a new one from the owner login page.");
      }
    });
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmation = String(form.get("confirmation") || "");

    if (password.length < 8) return setMessage("Use at least 8 characters.");
    if (password !== confirmation) return setMessage("The passwords do not match.");

    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMessage(error.message);
    setComplete(true);
    setMessage("Your password has been updated.");
  };

  return (
    <section className="grid min-h-screen place-items-center bg-wine p-5">
      <div className="w-full max-w-md rounded-[2rem] bg-cream p-8 md:p-10">
        {complete ? <Check className="mb-5 text-wine" /> : <Lock className="mb-5 text-wine" />}
        <p className="label">MoonMuse owner account</p>
        <h1 className="text-5xl">{complete ? "Password updated." : "Create a new password."}</h1>

        {complete ? (
          <Link className="btn mt-7 w-full" to="/admin/login">Continue to Owner Login</Link>
        ) : ready ? (
          <form onSubmit={submit} className="mt-7">
            <label className="block">
              <span className="label">New password</span>
              <input className="field" name="password" type="password" minLength={8} required autoComplete="new-password" />
            </label>
            <label className="mt-4 block">
              <span className="label">Confirm new password</span>
              <input className="field" name="confirmation" type="password" minLength={8} required autoComplete="new-password" />
            </label>
            <button disabled={busy} className="btn mt-7 w-full">{busy ? "Updating…" : "Save New Password"}</button>
          </form>
        ) : null}

        {message && <p className="mt-5 rounded-2xl bg-blush/20 p-4 text-sm">{message}</p>}
        {!ready && !complete && <Link className="mt-5 block text-center text-sm underline" to="/admin/login">Return to Owner Login</Link>}
      </div>
    </section>
  );
}
