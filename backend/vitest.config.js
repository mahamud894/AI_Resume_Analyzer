import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        setupFiles: ["./tests/setup.js"],
        // Each test file starts its own in-memory MongoDB; run files one by one to keep it light
        fileParallelism: false,
        // The first run downloads the MongoDB binary, which can take a while
        hookTimeout: 120000,
    },
});
