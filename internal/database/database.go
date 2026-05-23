package database

import (
	"apex/internal/config"
	"apex/internal/models"
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(cfg config.Config) {
	var err error
	DB, err = gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatal("Failed to access sql.DB: ", err)
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	if cfg.SkipAutoMigrate {
		log.Println("SKIP_AUTOMIGRATE=true — running versioned SQL migrations instead of GORM AutoMigrate.")
		RunSQLMigrations(cfg)
		log.Println("Database connected and SQL-migrated")
		return
	}

	// Explicit SQL migrations BEFORE AutoMigrate — see /ORM_RULES.md
	RunMigrations(DB)

	if err := DB.AutoMigrate(
		&models.User{},
		&models.UserProfile{},
		&models.Class{},
		&models.ClassMember{},
		&models.Exam{},
		&models.ExamClass{},
		&models.Problem{},
		&models.TestCase{},
		&models.ExamAttempt{},
		&models.Submission{},
		&models.TestResult{},
		&models.Notification{},
		&models.Announcement{},
		&models.Folder{},
		&models.PasswordResetToken{},
	); err != nil {
		log.Fatal("Failed to migrate database: ", err)
	}

	RunPostMigrations(DB)

	log.Println("Database connected and migrated")
}
