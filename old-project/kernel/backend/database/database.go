package database

import (
	"kernel-backend/config"
	"kernel-backend/models"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(cfg config.Config) {
	var err error
	DB, err = gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = DB.AutoMigrate(
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
		&models.Notification{},
		&models.Message{},
		&models.Team{},
		&models.TeamMember{},
	)
	if err != nil {
		log.Fatal("Failed to auto-migrate:", err)
	}
}
