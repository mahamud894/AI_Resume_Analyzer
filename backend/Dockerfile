FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies (cached as long as the lockfile does not change)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.js ./
COPY src ./src

# Uploaded files are stored in MongoDB (GridFS), so the container needs no writable folder.
# It runs as the unprivileged "node" user: it cannot change its own code or dependencies (owned by root).
USER node

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Needs MONGO_URI, JWT_SECRET, GEMINI_API_KEY and CLIENT_URL (see .env.example)
CMD ["node", "server.js"]
