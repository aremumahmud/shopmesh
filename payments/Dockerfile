FROM node:22-alpine

# Prisma needs openssl at runtime on Alpine.
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3002
CMD ["node", "dist/src/index.js"]
