import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    // Public landing page (also where the QR code on our poster points to)
    index("routes/landing.tsx"),
    route('/auth', 'routes/auth.tsx'),

    // Logged-in pages
    route('/dashboard', 'routes/home.tsx'),
    route('/upload', 'routes/upload.tsx'),
    route('/resume/:id', 'routes/resume.tsx'),
    route('/resume/:id/improved/:analysisId', 'routes/improved.tsx'),
    route('/resume/:id/improved/:analysisId/cover-letter', 'routes/cover-letter.tsx'),
    route('/account', 'routes/account.tsx'),
    route('/wipe', 'routes/wipe.tsx'),
] satisfies RouteConfig;
