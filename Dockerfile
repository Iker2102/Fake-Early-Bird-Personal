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

RUN npx puppeteer browsers install chrome

EXPOSE 3000

CMD ["npm", "start"]