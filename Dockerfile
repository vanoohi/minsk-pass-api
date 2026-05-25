FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

COPY public ./public

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
