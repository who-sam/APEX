package main

import (
	"kernel-backend/config"
	"kernel-backend/database"
	"kernel-backend/grading"
	"kernel-backend/handlers"
	"kernel-backend/router"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	database.Connect(cfg)
	handlers.SetJWTSecret(cfg.JWTSecret)
	grading.SetJudge0URL(cfg.Judge0URL)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{cfg.CORSOrigin},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Content-Type", "Authorization"},
		MaxAge:       12 * time.Hour,
	}))

	router.Setup(r, cfg)
	r.Run(":" + cfg.ServerPort)
}
