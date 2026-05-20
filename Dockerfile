FROM node:22-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libxss1 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build
RUN mkdir -p dist/dashboard && cp -r src/dashboard/public dist/dashboard/public

EXPOSE 3000

CMD ["npm", "start"]