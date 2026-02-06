
# Base image
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (incorporating bcrypt build dependencies if needed, though pure js bcryptjs is preferred if native fails, but we assume environment matches)
# For alpine, sometimes we need python3 make g++ for native modules
# RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
