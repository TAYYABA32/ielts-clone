"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ChevronDownIcon } from "@/components/icons/CommonIcons";
import { NAV_ITEMS } from "@/lib/navigation/navigationConfig";
import { roleHomePath, type AuthUser } from "@/lib/api/auth";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

/**
 * Mobile navigation drawer — accordion sections (one open at a time) for
 * each nav item's children, built on native <dialog> for the same reason
 * ConfirmDialog is (focus-trapping, Escape-to-close, ::backdrop for free),
 * plus an explicit body-scroll lock since <dialog> alone doesn't stop the
 * page behind it from scrolling on touch devices.
 */
export function MobileDrawer({ open, onClose, user }: MobileDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      closeAndReset();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const closeAndReset = () => {
    onClose();
    setExpandedLabel(null);
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        closeAndReset();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) closeAndReset();
      }}
      aria-label="Mobile navigation"
      className="m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-black/50"
    >
      <div className="ml-auto flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto bg-[#1b2a4a] p-6 text-white shadow-2xl">
        <button
          type="button"
          onClick={closeAndReset}
          aria-label="Close menu"
          className="self-end rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white shadow-none hover:bg-white/20"
        >
          ✕
        </button>

        <nav aria-label="Mobile" className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const isExpanded = expandedLabel === item.label;

            return (
              <div key={item.label} className="border-b border-white/10">
                <div className="flex items-center justify-between">
                  <Link
                    href={item.href}
                    onClick={closeAndReset}
                    className="flex-1 rounded-lg px-3 py-3 text-sm font-semibold text-white/90 no-underline hover:bg-white/10 hover:text-white hover:no-underline"
                  >
                    {item.label}
                  </Link>
                  {hasChildren && (
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${item.label}`}
                      onClick={() => setExpandedLabel(isExpanded ? null : item.label)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center bg-transparent p-0 text-white shadow-none hover:bg-white/10"
                    >
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>

                {hasChildren && (
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-out ${
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 pb-2 pl-3">
                      {item.children!.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={closeAndReset}
                          className="rounded-lg px-3 py-2 text-sm text-white/70 no-underline hover:bg-white/10 hover:text-white hover:no-underline"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-6">
          {user ? (
            <>
              <Link
                href={roleHomePath(user.role)}
                onClick={closeAndReset}
                className="rounded-full bg-white/10 px-4 py-2.5 text-center text-sm font-semibold text-white no-underline hover:bg-white/20 hover:no-underline"
              >
                {user.role === "ADMIN" || user.role === "CONTENT_EDITOR" ? "Admin" : "Dashboard"}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-full bg-transparent px-4 py-2.5 text-center text-sm font-semibold text-white shadow-none hover:bg-white/10"
              >
                {isLoggingOut ? "Logging out…" : "Log Out"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                onClick={closeAndReset}
                className="rounded-full bg-[#00b4d8] px-4 py-2.5 text-center text-sm font-bold text-white no-underline hover:bg-[#00a0c2] hover:no-underline"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                onClick={closeAndReset}
                className="rounded-full bg-white/10 px-4 py-2.5 text-center text-sm font-semibold text-white no-underline hover:bg-white/20 hover:no-underline"
              >
                Log In
              </Link>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
