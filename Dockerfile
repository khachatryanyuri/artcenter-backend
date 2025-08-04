FROM node:18.16.1-alpine as builder

WORKDIR /

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18.16.1-alpine

WORKDIR /

# Install dependencies for LibreOffice
RUN apk update && apk add --no-cache \
    bash \
    fontconfig \
    ttf-dejavu \
    ttf-droid \
    libreoffice \
    && rm -rf /var/cache/apk/*

# Copy from builder stage
COPY --from=builder /package*.json ./
COPY --from=builder /build ./build
COPY --from=builder /utils ./utils

RUN npm install --only=production

CMD ["npm", "start"]
