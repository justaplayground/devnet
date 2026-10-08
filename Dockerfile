# Frontend SPA build → static assets for edge Nginx
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY index.html vite.config.ts tsconfig*.json tailwind.config.ts postcss.config.js components.json ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginx:1.27-alpine AS edge
COPY infra/nginx/edge.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/dist /usr/share/nginx/html/devnet
EXPOSE 80
