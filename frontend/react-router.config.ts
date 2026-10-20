import type { Config } from "@react-router/dev/config";

export default {
  // Server-side rendering locally and in Docker (react-router-serve).
  // On Vercel (it sets VERCEL=1 while building) the app is built as a static SPA instead: every page
  // loads its data in the browser, so no server is needed there, and Vercel's React Router preset
  // (which only supports React Router 7) is not required. See frontend/vercel.json.
  ssr: !process.env.VERCEL,
} satisfies Config;
