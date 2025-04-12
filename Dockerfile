ARG NODE_VERSION="20.17"

# Base image
FROM docker.io/node:${NODE_VERSION}-alpine3.19 AS base

ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache \
	caddy \
	bash=5.2.21-r0 \
	supervisor=4.2.5-r4

WORKDIR /app

EXPOSE 3000
EXPOSE 4200
EXPOSE 5000

COPY var/docker/entrypoint.sh /app/entrypoint.sh
COPY var/docker/supervisord.conf /etc/supervisord.conf
COPY var/docker/supervisord /app/supervisord_available_configs/
COPY var/docker/Caddyfile /app/Caddyfile
COPY .env.example /config/postiz.env

LABEL org.opencontainers.image.source=https://github.com/gitroomhq/postiz-app

ENTRYPOINT ["/app/entrypoint.sh"]

# Builder image
FROM base AS devcontainer

RUN apk add --no-cache \
	pkgconfig \
	gcc \
	pixman-dev \
	cairo-dev \
	pango-dev \
	make \
	build-base

COPY nx.json tsconfig.base.json package.json package-lock.json build.plugins.js /app/
COPY apps /app/apps/
COPY libraries /app/libraries/

# ✅ FIXED: use legacy-peer-deps to resolve npm conflict
RUN npm ci --legacy-peer-deps --no-fund && npx nx run-many --target=build --projects=frontend,backend,workers,cron

LABEL org.opencontainers.image.title="Postiz App (DevContainer)"

# Output image
FROM base AS dist

COPY --from=devcontainer /app/node_modules/ /app/node_modules/
COPY --from=devcontainer /app/dist/ /app/dist/
COPY --from=devcontainer /app/libraries/ /app/libraries/
COPY package.json nx.json /app/

LABEL org.opencontainers.image.title="Postiz App (Production)"
