FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend deps
COPY package*.json ./
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Build backend
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Install frontend deps and build
COPY client/package*.json ./client/
RUN npm ci --prefix client

COPY client ./client
RUN npm run build --prefix client

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
