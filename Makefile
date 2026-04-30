.DEFAULT_GOAL := help

## GENERAL ##
OWNER               = backend-corps
SERVICE_NAME        = condo-net
USERNAME_LOCAL      ?= "$(shell whoami)"
UID_LOCAL           ?= "$(shell id -u)"
GID_LOCAL           ?= "$(shell id -g)"

## DEV ##
DOCKER_NETWORK      = services_network
TAG_DEV             = dev

## RESULT VARS ##
PROJECT_NAME        = ${OWNER}-dev-${SERVICE_NAME}
CONTAINER_NAME      = ${PROJECT_NAME}_backend
IMAGE_DEV           = ${PROJECT_NAME}:${TAG_DEV}
PROJECT_DOMAIN      = condonet.test
API_INTERNAL_URL    = http://condopy-api:7501
NEXT_PUBLIC_API_URL = /api-proxy
APP_DIR             = src
PNPM                = corepack pnpm

build: ## build the app image with frontend dependencies
	@make verify_network &> /dev/null
	@IMAGE_DEV=${IMAGE_DEV} \
	CONTAINER_NAME=${CONTAINER_NAME} \
	DOCKER_NETWORK=${DOCKER_NETWORK} \
	PROJECT_DOMAIN=${PROJECT_DOMAIN} \
	API_INTERNAL_URL=${API_INTERNAL_URL} \
	NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
	docker-compose -p ${SERVICE_NAME} build backend

up: ## start the app behind traefik (dev / next dev)
	@make verify_network &> /dev/null
	@IMAGE_DEV=${IMAGE_DEV} \
	CONTAINER_NAME=${CONTAINER_NAME} \
	DOCKER_NETWORK=${DOCKER_NETWORK} \
	PROJECT_DOMAIN=${PROJECT_DOMAIN} \
	API_INTERNAL_URL=${API_INTERNAL_URL} \
	NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
	docker-compose -p ${SERVICE_NAME} up -d backend
	@make status

up-qa: ## run QA-stable mode locally (build + next start, outside docker)
	@cd ${APP_DIR} && API_INTERNAL_URL=${API_INTERNAL_URL} NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} PROJECT_DOMAIN=${PROJECT_DOMAIN} ${PNPM} build
	@cd ${APP_DIR} && API_INTERNAL_URL=${API_INTERNAL_URL} NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} PROJECT_DOMAIN=${PROJECT_DOMAIN} ${PNPM} start --hostname 0.0.0.0 --port 3000

hosts: ## add local domain hint and try to register it in WSL hosts
	@make add_local_domain HOST_NAME=${PROJECT_DOMAIN}
	@make windows_hosts_hint HOST_NAME=${PROJECT_DOMAIN}

stop: ## stop the app container
	@IMAGE_DEV=${IMAGE_DEV} \
	CONTAINER_NAME=${CONTAINER_NAME} \
	DOCKER_NETWORK=${DOCKER_NETWORK} \
	PROJECT_DOMAIN=${PROJECT_DOMAIN} \
	API_INTERNAL_URL=${API_INTERNAL_URL} \
	NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
	docker-compose -p ${SERVICE_NAME} stop

down: ## remove the app container
	@IMAGE_DEV=${IMAGE_DEV} \
	CONTAINER_NAME=${CONTAINER_NAME} \
	DOCKER_NETWORK=${DOCKER_NETWORK} \
	PROJECT_DOMAIN=${PROJECT_DOMAIN} \
	API_INTERNAL_URL=${API_INTERNAL_URL} \
	NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
	docker-compose -p ${SERVICE_NAME} down

clean-cache: ## remove the persisted Next.js dev cache volume
	@IMAGE_DEV=${IMAGE_DEV} \
	CONTAINER_NAME=${CONTAINER_NAME} \
	DOCKER_NETWORK=${DOCKER_NETWORK} \
	PROJECT_DOMAIN=${PROJECT_DOMAIN} \
	API_INTERNAL_URL=${API_INTERNAL_URL} \
	NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
	docker-compose -p ${SERVICE_NAME} down
	@docker volume rm -f ${SERVICE_NAME}_condo_backdmin_next 2>/dev/null || true

logs: ## tail container logs
	@IMAGE_DEV=${IMAGE_DEV} \
	CONTAINER_NAME=${CONTAINER_NAME} \
	DOCKER_NETWORK=${DOCKER_NETWORK} \
	PROJECT_DOMAIN=${PROJECT_DOMAIN} \
	API_INTERNAL_URL=${API_INTERNAL_URL} \
	NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
	docker-compose -p ${SERVICE_NAME} logs -f

zrok: ## expose local frontend via zrok public tunnel (https://condobackdmin.share.zrok.io)
	@printf "\033[36m🚀 Starting zrok tunnel for %s...\033[0m\n" "${PROJECT_DOMAIN}"
	@make up &> /dev/null
	@sleep 5
	@pkill -f "zrok share reserved condobackdmin" 2>/dev/null || true
	@nohup zrok share reserved condobackdmin --headless > /tmp/zrok-condobackdmin.log 2>&1 &
	@sleep 4
	@printf "\033[32m✅ https://condobackdmin.share.zrok.io is live\033[0m\n"

status: ## show container status
	@IMAGE_DEV=${IMAGE_DEV} \
	CONTAINER_NAME=${CONTAINER_NAME} \
	DOCKER_NETWORK=${DOCKER_NETWORK} \
	PROJECT_DOMAIN=${PROJECT_DOMAIN} \
	API_INTERNAL_URL=${API_INTERNAL_URL} \
	NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
	docker-compose -p ${SERVICE_NAME} ps

verify-env: ## verify domain, proxy and live container wiring
	@printf "Expected domain: %s\n" "${PROJECT_DOMAIN}"
	@printf "Expected public API URL: %s\n" "${NEXT_PUBLIC_API_URL}"
	@printf "Expected internal API URL: %s\n\n" "${API_INTERNAL_URL}"
	@printf '%s\n' '--- .env ---'
	@sed -n '1,80p' .env 2>/dev/null || echo 'no .env'
	@printf '\n%s\n' '--- running condo-backdmin containers ---'
	@docker ps -a --format '{{.Names}}\t{{.Status}}' | grep 'condo-backdmin' || true
	@printf '\n%s\n' '--- traefik router match ---'
	@curl -s http://127.0.0.1:1936/api/http/routers | grep -o 'Host(`[^`]*`)' | sort -u || true
	@printf '\n%s\n' '--- host check ---'
	@curl -sSI -H 'Host: ${PROJECT_DOMAIN}' http://127.0.0.1/ | sed -n '1,10p' || true

doctor: verify-env ## quick health check for local docker routing
	@printf '\n%s\n' '--- container health ---'
	@docker inspect ${CONTAINER_NAME} --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' 2>/dev/null || true

app-install: ## install frontend deps inside src/
	@cd ${APP_DIR} && ${PNPM} install --frozen-lockfile

app-dev: ## run next dev locally from src/
	@cd ${APP_DIR} && API_INTERNAL_URL=${API_INTERNAL_URL} NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} PROJECT_DOMAIN=${PROJECT_DOMAIN} ${PNPM} dev --hostname 0.0.0.0 --port 3000

app-build: ## build next app locally from src/
	@cd ${APP_DIR} && API_INTERNAL_URL=${API_INTERNAL_URL} NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} PROJECT_DOMAIN=${PROJECT_DOMAIN} ${PNPM} build

app-start: ## start built next app locally from src/
	@cd ${APP_DIR} && API_INTERNAL_URL=${API_INTERNAL_URL} NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} PROJECT_DOMAIN=${PROJECT_DOMAIN} ${PNPM} start

verify_network:
	@if [ -z $$(docker network ls | grep ${DOCKER_NETWORK} | awk '{print $$2}') ]; then \
		(docker network create ${DOCKER_NETWORK}); \
	fi

add_local_domain:
	@if [ -z "${HOST_NAME}" ]; then (echo "Please set HOST_NAME=local.sample.test" && exit 1); fi
	$(eval ETC_HOSTS := /etc/hosts)
	$(eval IP := 127.0.0.1)
	$(eval HOSTS_LINE := '$(IP)\t$(HOST_NAME)')
	@if [ -n "$$(grep $(HOST_NAME) $(ETC_HOSTS))" ]; then \
		echo "$(HOST_NAME) already exists in WSL hosts: $$(grep $(HOST_NAME) $(ETC_HOSTS))"; \
	else \
		echo "Adding $(HOST_NAME) to WSL hosts"; \
		sudo -- sh -c -e "echo $(HOSTS_LINE) >> $(ETC_HOSTS)"; \
	fi

windows_hosts_hint:
	@if [ -z "${HOST_NAME}" ]; then (echo "Please set HOST_NAME=local.sample.test" && exit 1); fi
	@printf "\nAdd this to Windows hosts (as Administrator) if it is missing:\n127.0.0.1\t%s\n\n" "${HOST_NAME}"

help:
	@grep -hE '^\S+:.*## .*$$' $(MAKEFILE_LIST) | sed -e 's/:.*##\s*/:/' | sort | awk 'BEGIN {FS = ":"}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
