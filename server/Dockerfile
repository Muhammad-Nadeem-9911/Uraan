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
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 && \
    # Clean up apt lists to reduce final image size
    rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json from your server's directory.
# This path assumes your 'Uraan' folder (containing 'server') is at the root
# of your repository, next to this Dockerfile.
COPY package*.json ./

# Install application dependencies using the versions from package-lock.json
RUN npm install --frozen-lockfile --production

# Copy the rest of your server application code
COPY . .

# Your d:\Uraan\server\package.json specifies "main": "src/server.js".
# Puppeteer in d:\Uraan\server\src\routes\pdfRoutes.js is already configured to look for
# /usr/bin/chromium-browser, which is where apt-get will install it.
CMD [ "node", "src/server.js" ]