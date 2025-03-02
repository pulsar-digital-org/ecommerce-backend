# builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --workspaces=false --install-links
COPY . .
RUN npm run db:migrate

# runner
# To enable ssh & remote debugging on app service change the base image to the one below
# FROM mcr.microsoft.com/azure-functions/node:4-node20-appservice
FROM mcr.microsoft.com/azure-functions/node:4-node20 AS runner

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    CORS_ALLOWED_ORIGINS="[\"*\"]" \
    CONTAINER_NAME="panco"

WORKDIR /home/site/wwwroot

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
