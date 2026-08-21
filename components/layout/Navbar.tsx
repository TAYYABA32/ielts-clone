"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { BrandLogo } from "./BrandLogo";
import { HomeIcon } from "@/components/icons/CommonIcons";
import { DesktopNavigation } from "./nav/DesktopNavigation";
import { MobileDrawer } from "./nav/MobileDrawer";
import { roleHomePath, type AuthUser } from "@/lib/api/auth";

// Same reset the rest of the site uses to turn a plain <button> back into
// text — otherwise the global base `button` style in globals.css gives it
// a filled background/padding that doesn't match the Dashboard/Sign Up/Log
// In links it sits next to.
const NAV_ACTION_TEXT_CLASS =
  "whitespace-nowrap bg-transparent p-0 text-sm font-semibold text-white no-underline shadow-none hover:bg-transparent hover:text-white/80 hover:no-underline";

// Shared by both tiers so the logo and the nav row align on the same left
// edge — max-w-[1170px]/px-[15px] is the reference site's own container
// (Bootstrap's .container at its largest breakpoint), not an estimate.
const CONTAINER = "mx-auto max-w-[1170px] px-[15px]";

// Exact values read from the reference site's shipped CSS (.menu / .main-menu
// > li > a), not eyeballed: 50px bar height, #294563 background, each link
// 0/10px padding with no extra gap between them, 14px/800-weight white text,
// #536b83 hover background (not a text-color change).
const HOME_LINK_CLASS =
  "flex h-[50px] shrink-0 items-center whitespace-nowrap px-[10px] text-sm font-extrabold text-white no-underline hover:bg-[#536b83] hover:no-underline";

interface NavbarProps {
  user: AuthUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      // NavbarAsync's user prop comes from a Server Component DB lookup —
      // signOut() alone clears the Clerk cookie but doesn't re-run that
      // lookup. refresh() does, so the navbar actually flips back to
      // Sign Up/Log In instead of still showing Dashboard until the next
      // full navigation.
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top tier: white, logo only. 20px vertical padding (py-5), matching
          the reference's .header .container { padding: 20px 15px }. */}
      <div className="w-full bg-white">
        <div className={`${CONTAINER} py-5`}>
          <Link href="/" className="inline-block no-underline hover:no-underline">
            <BrandLogo />
          </Link>
        </div>
      </div>

      {/* Bottom tier: dark navy nav bar — exactly 50px tall, no vertical padding. */}
      <div className="w-full bg-[#294563]">
        <div className={`${CONTAINER} flex h-[50px] items-stretch justify-between`}>
          <nav aria-label="Primary" className="hidden h-full min-w-0 items-stretch md:flex">
            <a href="/" aria-label="Home" className={HOME_LINK_CLASS}>
              <HomeIcon className="h-4 w-4" />
            </a>

            <DesktopNavigation />
          </nav>

          {/* Mobile: just the home icon + hamburger trigger; everything else moves into MobileDrawer */}
          <div className="flex h-full items-center md:hidden">
            <a href="/" aria-label="Home" className={HOME_LINK_CLASS}>
              <HomeIcon className="h-4 w-4" />
            </a>
          </div>

          <div className="hidden shrink-0 items-center gap-4 md:flex">
            {user ? (
              <>
                <Link
                  href={roleHomePath(user.role)}
                  className="whitespace-nowrap text-sm font-semibold text-white no-underline hover:text-white/80 hover:no-underline"
                >
                  {user.role === "ADMIN" || user.role === "CONTENT_EDITOR" ? "Admin" : "Dashboard"}
                </Link>
                <button type="button" onClick={handleLogout} disabled={isLoggingOut} className={NAV_ACTION_TEXT_CLASS}>
                  {isLoggingOut ? "Logging out…" : "Log Out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="whitespace-nowrap text-sm font-semibold text-white no-underline hover:text-white/80 hover:no-underline"
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="whitespace-nowrap text-sm font-semibold text-white no-underline hover:text-white/80 hover:no-underline"
                >
                  Log In
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            className="flex shrink-0 items-center gap-1.5 bg-transparent p-0 text-white shadow-none hover:text-white/80 md:hidden"
          >
            <span aria-hidden="true" className="flex h-4 w-5 flex-col justify-between">
              <span className="h-0.5 w-full rounded bg-current" />
              <span className="h-0.5 w-full rounded bg-current" />
              <span className="h-0.5 w-full rounded bg-current" />
            </span>
          </button>
        </div>
      </div>

      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} user={user} />
    </header>
  );
}
