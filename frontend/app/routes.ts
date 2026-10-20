import {type RouteConfig, index, route} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('/auth', 'routes/auth.tsx'),
    route('/upload', 'routes/upload.tsx'),
    route('/resume/:id', 'routes/resume.tsx'),
    route('/resume/:id/improved/:analysisId', 'routes/improved.tsx'),
    route('/resume/:id/improved/:analysisId/cover-letter', 'routes/cover-letter.tsx'),
    route('/account', 'routes/account.tsx'),
    route('/wipe', 'routes/wipe.tsx'),
] satisfies RouteConfig;
