FROM node:22

WORKDIR /app

ARG RAILPACK_VERSION=0.23.0
ARG TARGETARCH=amd64

# install dependencies
RUN apt-get update && apt-get install -y git curl

# install docker CLI
RUN curl -fsSL https://get.docker.com | sh

# install railpack
RUN set -eux; \
  case "$TARGETARCH" in \
    amd64) railpack_arch="x86_64" ;; \
    arm64) railpack_arch="arm64" ;; \
    *) echo "Unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
  esac; \
  curl -fL "https://github.com/railwayapp/railpack/releases/download/v${RAILPACK_VERSION}/railpack-v${RAILPACK_VERSION}-${railpack_arch}-unknown-linux-musl.tar.gz" \
    -o /tmp/railpack.tar.gz; \
  tar -xzf /tmp/railpack.tar.gz -C /usr/local/bin railpack; \
  rm /tmp/railpack.tar.gz; \
  chmod +x /usr/local/bin/railpack; \
  railpack --version

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
