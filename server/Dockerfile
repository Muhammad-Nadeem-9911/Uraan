# Use an official Node.js runtime as a parent image.
# node:18-slim is Debian-based (Bullseye).
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Install apt-utils to potentially reduce some apt warnings, and then system dependencies for Puppeteer.
# The "mkdir -p /var/lib/apt/lists/partial" is a speculative fix:
# if the error is specifically about creating this directory on a read-only fs,
# this won't help, but if it's a transient issue or a problem with apt-get itself, it might.
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
    apt-utils \
    ca-certificates \
    fonts-liberation \
    # For NotoNastaliqUrdu font to be available system-wide (optional if only using base64 embed)
    # fonts-noto-core \ 
    chromium \
    libasound2 \
    libnss3 \
    libpango-1.0-0 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libnspr4 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \

    libxss1 \
    libxtst6 && \
    # Create a symlink so Puppeteer's default path for chromium-browser works.
    # The 'chromium' package installs its executable to /usr/bin/chromium.
    # Your pdfRoutes.js looks for /usr/bin/chromium-browser.
    ln -s /usr/bin/chromium /usr/bin/chromium-browser && \
    # Clean up apt lists to reduce final image size
    rm -rf /var/lib/apt/lists/*

# Create a non-root user and group
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

# Copy font files (if you want them system-available beyond base64 embedding)
# This assumes your fonts are in Uraan/server/src/public/fonts relative to the repo root
# and your Docker build context is Uraan/server/
COPY src/public/fonts /usr/share/fonts/truetype/noto/
RUN fc-cache -fv # Rebuild font cache

# Copy package.json and package-lock.json from your server's directory.
# This path assumes your 'Uraan' folder (containing 'server') is at the root
# of your repository, next to this Dockerfile.
COPY package*.json ./

# Install application dependencies using the versions from package-lock.json
RUN npm install --frozen-lockfile --production
# chown the app directory to the new user
RUN chown -R nodejs:nodejs /usr/src/app

# Copy the rest of your server application code
COPY . .

# Switch to the non-root user
USER nodejs

# Your d:\Uraan\server\package.json specifies "main": "src/server.js".
# Puppeteer in d:\Uraan\server\src\routes\pdfRoutes.js is already configured to look for
# /usr/bin/chromium-browser, which is where apt-get will install it.
CMD [ "node", "src/server.js" ]