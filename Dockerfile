FROM ghcr.io/puppeteer/puppeteer:latest

USER root

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN mkdir -p dist/dashboard \
    && cp -r src/dashboard/public dist/dashboard/public

RUN mkdir -p /app/.wwebjs_auth /app/.wwebjs_cache /app/data \
    && chown -R pptruser:pptruser /app

USER pptruser

RUN rm -rf /home/pptruser/.cache/puppeteer/chrome/linux-146.0.7680.31 \
    && npx puppeteer browsers install chrome@stable \
    && CHROME_PATH=$(find /home/pptruser/.cache/puppeteer -name chrome -type f | head -n 1) \
    && mkdir -p /home/pptruser/.local/bin \
    && ln -sf "$CHROME_PATH" /home/pptruser/.local/bin/chrome

RUN rm -rf /home/pptruser/.cache/puppeteer/chrome/linux-146.0.7680.31 \
    && npx puppeteer browsers install chrome

EXPOSE 3000

CMD ["npm", "start"]