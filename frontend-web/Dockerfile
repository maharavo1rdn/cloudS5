# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Augmenter la mémoire et désactiver source maps pour accélérer
ENV NODE_OPTIONS=--max_old_space_size=4096
ENV GENERATE_SOURCEMAP=false
ENV CI=false

COPY package*.json ./
RUN npm install --legacy-peer-deps --prefer-offline

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]