// Package main implements the apex-migrate CLI.
//
// Usage:
//
//	apex-migrate up        # apply all pending migrations
//	apex-migrate down      # roll back one migration
//	apex-migrate version   # print current version
//	apex-migrate force N   # mark database at version N (recovery)
//
// Reads DATABASE_URL (or DB_* fallback vars via internal/config).
// Migration SQL lives in internal/database/migrations/sql.
package main

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"

	"apex/internal/config"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

const defaultSource = "file://internal/database/migrations/sql"

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(2)
	}

	cfg := config.Load()

	source := os.Getenv("MIGRATIONS_DIR")
	if source == "" {
		source = defaultSource
	}

	m, err := migrate.New(source, cfg.MigrateURL())
	if err != nil {
		log.Fatalf("migrate init: %v", err)
	}
	defer func() {
		if srcErr, dbErr := m.Close(); srcErr != nil || dbErr != nil {
			log.Printf("migrate close: src=%v db=%v", srcErr, dbErr)
		}
	}()

	switch os.Args[1] {
	case "up":
		run(m.Up)
	case "down":
		run(func() error { return m.Steps(-1) })
	case "version":
		v, dirty, err := m.Version()
		if errors.Is(err, migrate.ErrNilVersion) {
			fmt.Println("no migrations applied")
			return
		}
		if err != nil {
			log.Fatalf("version: %v", err)
		}
		fmt.Printf("version=%d dirty=%v\n", v, dirty)
	case "force":
		if len(os.Args) < 3 {
			log.Fatal("force requires a version argument")
		}
		v, err := strconv.Atoi(os.Args[2])
		if err != nil {
			log.Fatalf("force: invalid version %q", os.Args[2])
		}
		if err := m.Force(v); err != nil {
			log.Fatalf("force: %v", err)
		}
		fmt.Printf("forced to version %d\n", v)
	default:
		usage()
		os.Exit(2)
	}
}

func run(fn func() error) {
	if err := fn(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		log.Fatalf("migrate: %v", err)
	}
	fmt.Println("ok")
}

func usage() {
	fmt.Fprintln(os.Stderr, "usage: apex-migrate [up|down|version|force <n>]")
}
