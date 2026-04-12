package database

import (
	"apex/internal/config"
	"apex/internal/models"
	"log"

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

	if err := DB.AutoMigrate(
		&models.User{},
		&models.UserProfile{},
		&models.Class{},
		&models.ClassMember{},
		&models.Exam{},
		&models.ExamClass{},
		&models.Problem{},
		&models.TestCase{},
		&models.Submission{},
		&models.TestResult{},
		&models.Message{},
		&models.Notification{},
		&models.Team{},
		&models.TeamMember{},
	); err != nil {
		log.Fatal("Failed to migrate database: ", err)
	}

	log.Println("Database connected and migrated")
}
