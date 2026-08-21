import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Centered card shell shared by /login and /signup. */
export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/50">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
