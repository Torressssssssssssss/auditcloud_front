FROM node:22-alpine AS compilacion

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine AS ejecucion

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacion /app/dist/auditcloud_front/browser/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
