import { Heart, Instagram, Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const links = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["Personalised Gifts", "/personalised-gifts"],
  ["Gallery", "/gallery"],
  ["About", "/about"],
  ["Order Status", "/track-order"],
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 border-b border-wine/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-10">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-semibold text-wine"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-wine text-cream">
              ☾
            </span>
            <span className="font-serif">MoonMuse</span>
          </Link>
          <nav className="hidden items-center gap-5 lg:flex">
            {links.map(([name, path]) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `text-sm ${isActive ? "font-semibold text-wine" : "text-ink/70 hover:text-wine"}`
                }
              >
                {name}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/cart"
              aria-label="Bag"
              className="rounded-full border border-wine/15 p-2.5"
            >
              <ShoppingBag size={18} />
            </Link>
            <button className="lg:hidden" onClick={() => setOpen(!open)}>
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="grid gap-4 border-t border-wine/10 px-6 py-5 lg:hidden">
            {links.map(([name, path]) => (
              <Link onClick={() => setOpen(false)} key={path} to={path}>
                {name}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main>{children}</main>
      <footer className="noise text-cream">
        <div className="section grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="font-serif text-3xl">☾ MoonMuse</div>
            <p className="mt-3 max-w-sm text-sm text-cream/70">
              Tiny details, honest feelings, and keepsakes made slowly by hand
              in India.
            </p>
          </div>
          <div>
            <p className="label !text-cream/50">Explore</p>
            {links.slice(0, 4).map(([name, path]) => (
              <Link className="mr-4 block py-1 text-sm" key={path} to={path}>
                {name}
              </Link>
            ))}
          </div>
          <div>
            <p className="label !text-cream/50">Stay close</p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/_moon.muse__?igsi=dGN0eGQ4MWVocHVt&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit MoonMuse on Instagram"
                className="rounded-full text-cream transition-colors hover:text-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush"
              >
                <Instagram />
              </a>
              <Heart />
            </div>
            <p className="mt-5 text-xs text-cream/50">
              © 2026 MoonMuse · Created by Janvi Mahajan
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  text,
  image = true,
}: {
  eyebrow: string;
  title: string;
  text: string;
  image?: boolean;
}) {
  return (
    <section className="bg-wine text-cream">
      <div className="mx-auto grid max-w-7xl md:grid-cols-2">
        <div className="flex min-h-[360px] flex-col justify-center px-7 py-16 md:px-14">
          <p className="mb-5 text-xs uppercase tracking-[.25em] text-blush">
            {eyebrow}
          </p>
          <h1 className="text-5xl leading-[.95] md:text-7xl">{title}</h1>
          <p className="mt-6 max-w-lg text-cream/75">{text}</p>
        </div>
        {image && (
          <img
            src="/images/moonmuse-studio.png"
            className="h-[360px] w-full object-cover md:h-full"
            alt="MoonMuse handmade memory frame and painted tote"
          />
        )}
      </div>
    </section>
  );
}
