import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    // এটি আপনার নতুন ল্যান্ডিং পেজ (QR স্ক্যান করলে এখানেই আসবে)
    index("routes/landing.tsx"), 
    
    route('/auth', 'routes/auth.tsx'),
    route('/upload', 'routes/upload.tsx'),
    route('/resume/:id', 'routes/resume.tsx'),
    route('/resume/:id/improved/:analysisId', 'routes/improved.tsx'),
    route('/resume/:id/improved/:analysisId/cover-letter', 'routes/cover-letter.tsx'),
    route('/account', 'routes/account.tsx'),
    route('/wipe', 'routes/wipe.tsx'),
    
    // আপনি চাইলে পুরনো home.tsx-কেও অন্য কোনো নামে রাখতে পারেন, 
    // তবে আপাতত ল্যান্ডিং পেজই মূল ফেস হিসেবে থাকবে।
] satisfies RouteConfig;