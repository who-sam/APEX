package database

import (
	"errors"
	"log"
	"os"

	"apex/internal/config"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// RunSQLMigrations applies all pending versioned SQL migrations from
// internal/database/migrations/sql against the configured database.
//
// Used in production (SKIP_AUTOMIGRATE=true) so a single binary deploy can
// upgrade its own schema without a separate pre-deploy job. The migrations
// directory is overridable via MIGRATIONS_DIR for non-standard layouts.
func RunSQLMigrations(cfg config.Config) {
	source := os.Getenv("MIGRATIONS_DIR")
	if source == "" {
		source = "file://internal/database/migrations/sql"
	}

	m, err := migrate.New(source, cfg.MigrateURL())
	if err != nil {
		log.Fatalf("sql-migrate init: %v", err)
	}
	defer func() {
		if srcErr, dbErr := m.Close(); srcErr != nil || dbErr != nil {
			log.Printf("sql-migrate close: src=%v db=%v", srcErr, dbErr)
		}
	}()

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		log.Fatalf("sql-migrate up: %v", err)
	}

	v, dirty, err := m.Version()
	switch {
	case errors.Is(err, migrate.ErrNilVersion):
		log.Println("sql-migrate: no migrations applied yet")
	case err != nil:
		log.Printf("sql-migrate: version check failed: %v", err)
	default:
		log.Printf("sql-migrate: at version %d (dirty=%v)", v, dirty)
	}
}
