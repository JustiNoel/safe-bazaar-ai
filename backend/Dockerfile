FROM node:18-alpine
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
# If a lockfile is present, `npm ci` is ideal; but allow `npm install` when none exists.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy source
COPY . .

# Expose port
EXPOSE 5000

# Start
CMD ["node", "src/index.js"]
