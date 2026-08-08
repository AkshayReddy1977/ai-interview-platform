FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY server/package.json ./server/
RUN npm install --workspace=server
COPY server ./server
RUN npm run build --workspace=server

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/server/package.json ./package.json
COPY --from=build /app/server/dist ./dist
RUN npm install --omit=dev
EXPOSE 5000
CMD ["node", "dist/server.js"]
