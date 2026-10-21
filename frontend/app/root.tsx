import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import {useAuthStore} from "~/lib/auth";
import {useEffect} from "react";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((state) => state.init);

  useEffect(() => {
    init()
  }, [init]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const code = isRouteErrorResponse(error) ? String(error.status) : "Oops";
  const title = notFound ? "This page took a wrong turn" : "Something went wrong";
  const details = notFound
    ? "The page you are looking for does not exist or was moved. Let's get you back on track."
    : isRouteErrorResponse(error)
      ? error.statusText || "An unexpected error occurred."
      : "An unexpected error occurred. Please try again.";
  const stack = import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  return (
    <main className="page-bg-long !pt-0 min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl flex flex-col items-center text-center gap-5">
        <a href="/" className="text-2xl font-bold text-gradient min-h-11 flex items-center">RESUMIND</a>
        <div className="relative">
          <span aria-hidden="true" className="absolute inset-0 -z-10 blur-3xl rounded-full bg-gradient-to-r from-[#8e98ff]/40 via-[#FF97AD]/40 to-[#606beb]/40" />
          <p className="text-[6.5rem] sm:text-[9rem] leading-none font-bold text-gradient tracking-tight select-none">{code}</p>
        </div>
        <div className="bg-white/90 backdrop-blur rounded-3xl p-6 sm:p-8 shadow-sm ring-1 ring-black/[0.03] flex flex-col items-center gap-4 w-full">
          <h1 className="!text-2xl sm:!text-3xl !leading-tight">{title}</h1>
          <p className="text-dark-200">{details}</p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Plain links (full page load): they work even if the app itself crashed */}
            <a href="/" className="primary-button btn-shine sm:w-fit px-8">Go to Home</a>
            <a href="/dashboard" className="secondary-button px-8">My Dashboard</a>
          </div>
        </div>
        {stack && (
          <pre className="w-full p-4 overflow-x-auto text-left text-xs bg-white rounded-2xl">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
