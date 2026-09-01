import { FormEvent, useEffect, useState } from "react";
import { Check, Lock, User } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function AccountPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const next = params.get("next") || "/shop";

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => {
      if (data.session) setMessage("You are already signed in.");
    });
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setMessage("Customer accounts require Supabase configuration.");
      return;
    }
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const fullName = String(form.get("fullName") || "").trim();
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: "customer" } },
      });
      if (error) setMessage(error.message);
      else if (data.session) navigate(next);
      else setMessage("Check your email to confirm your MoonMuse account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else navigate(next);
    }
    setBusy(false);
  };

  return (
    <section className="section grid gap-7 lg:grid-cols-[1fr_360px]">
      <form onSubmit={submit} className="rounded-[2rem] bg-white p-7 md:p-10">
        <User className="mb-5 text-wine" />
        <p className="label">MoonMuse account</p>
        <h1 className="text-5xl">{mode === "login" ? "Welcome back." : "Create your account."}</h1>
        <p className="mb-7 mt-3 text-sm text-ink/60">
          Sign in to place orders and keep your MoonMuse details together.
        </p>
        {mode === "signup" && <AccountField label="Full name" name="fullName" />}
        <AccountField label="Email address" name="email" type="email" />
        <AccountField label="Password" name="password" type="password" />
        {message && <p className="mt-4 rounded-2xl bg-blush/20 p-4 text-sm">{message}</p>}
        <button disabled={busy} className="btn mt-6 w-full">
          {busy ? "Please wait…" : mode === "login" ? "Customer Login" : "Create Customer Account"}
        </button>
        <button type="button" className="mt-5 w-full text-sm underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>
          {mode === "login" ? "New customer? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
      <aside className="h-fit rounded-[2rem] bg-wine p-7 text-cream">
        <Lock className="text-blush" />
        <p className="label mt-5 !text-blush">For Janvi</p>
        <h2 className="text-4xl">Owner Dashboard</h2>
        <p className="mt-3 text-sm text-cream/65">Manage MoonMuse products, orders, prices and settings securely.</p>
        <Link className="btn-light mt-7 w-full" to="/admin">Owner Login</Link>
      </aside>
    </section>
  );
}

function AccountField({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return <label className="mb-4 block"><span className="label">{label}</span><input required minLength={type === "password" ? 8 : undefined} className="field" name={name} type={type} /></label>;
}

export function CheckoutLoginRequired() {
  return <section className="section text-center"><div className="mx-auto max-w-xl rounded-[2rem] bg-white p-10"><Lock className="mx-auto text-wine"/><p className="label mt-5">Customer account</p><h1 className="text-5xl">Sign in to checkout.</h1><p className="mt-4 text-ink/60">Your account helps keep your order and contact details secure.</p><Link className="btn mt-7" to="/login?next=/checkout">Login or Create Account</Link></div></section>;
}
