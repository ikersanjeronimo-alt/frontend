# --- Etapa de build: genera el bundle estatico con Vite ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vacio => las llamadas a la API son relativas (/api/...) y nginx hace de proxy.
ARG VITE_BACKEND_URL=
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
# WebSocket por el mismo origen: nginx proxia /ws al backend.
ENV VITE_WS_URL=/ws
ENV VITE_USE_MOCK_FALLBACK=false
RUN npm run build

# --- Etapa de runtime: nginx sirve el build y proxia /api al backend ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
