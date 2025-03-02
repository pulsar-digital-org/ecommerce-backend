# builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# runner
# To enable ssh & remote debugging on app service change the base image to the one below
# FROM mcr.microsoft.com/azure-functions/node:4-node20-appservice
FROM mcr.microsoft.com/azure-functions/node:4-node20 AS runner

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    CORS_ALLOWED_ORIGINS="[\"*\"]" \
    CONTAINER_NAME="panco"

WORKDIR /home/site/wwwroot

COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/apps/server/node_modules ./node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./dist

RUN npm run db:migrate

