# syntax=docker/dockerfile:1.7

FROM golang:1.26-alpine AS build
WORKDIR /src

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ENV CGO_ENABLED=0 GOOS=linux

RUN go build -trimpath -ldflags="-s -w" -o /out/apex ./
RUN go build -trimpath -ldflags="-s -w" -o /out/migrate ./cmd/migrate
RUN go build -trimpath -ldflags="-s -w" -o /out/seed ./cmd/seed

FROM gcr.io/distroless/static-debian12:nonroot AS runtime
WORKDIR /app

COPY --from=build /out/apex /app/apex
COPY --from=build /out/migrate /app/migrate
COPY --from=build /out/seed /app/seed
COPY --from=build /src/internal/database/migrations /app/internal/database/migrations

ENV PORT=8080
EXPOSE 8080

USER nonroot:nonroot
ENTRYPOINT ["/app/apex"]
