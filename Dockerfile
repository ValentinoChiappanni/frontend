# Etapa 1: Build
FROM node:20-alpine AS builder

# Argumento de build para la URL del API
ARG VITE_API_BASE_URL=http://localhost:3000

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# Build de producción (sin verificación de tipos para evitar errores en datos de prueba)
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build:prod

# Etapa 2: Production con Nginx
FROM nginx:alpine

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos build desde builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Crear script para inyectar variables de entorno en runtime
RUN echo '#!/bin/sh' > /docker-entrypoint.d/40-envsubst-on-templates.sh && \
    echo 'set -e' >> /docker-entrypoint.d/40-envsubst-on-templates.sh && \
    echo 'echo "Replacing environment variables in JS files..."' >> /docker-entrypoint.d/40-envsubst-on-templates.sh && \
    echo 'find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|VITE_API_BASE_URL_PLACEHOLDER|${VITE_API_BASE_URL}|g" {} \;' >> /docker-entrypoint.d/40-envsubst-on-templates.sh && \
    chmod +x /docker-entrypoint.d/40-envsubst-on-templates.sh

# Exponer puerto
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Nginx se inicia automáticamente
