package main

import (
	"codejudge-backend/config"
	"codejudge-backend/database"
	"codejudge-backend/handlers"
	"codejudge-backend/middleware"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	database.Connect(cfg)
	handlers.SetJWTSecret(cfg.JWTSecret)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	// Public routes
	auth := r.Group("/api/auth")
	{
		auth.POST("/signup", handlers.Signup)
		auth.POST("/login", handlers.Login)
	}

	// Protected routes
	api := r.Group("/api")
	api.Use(middleware.Auth(cfg.JWTSecret))
	{
		api.POST("/execute", handlers.Execute)

		// Class routes (teacher)
		teacherClasses := api.Group("/classes")
		teacherClasses.Use(middleware.RequireRole("teacher"))
		{
			teacherClasses.POST("", handlers.CreateClass)
			teacherClasses.GET("", handlers.GetClasses)
			teacherClasses.GET("/:id", handlers.GetClass)
			teacherClasses.DELETE("/:id", handlers.DeleteClass)
			teacherClasses.GET("/:id/stats", handlers.GetClassStats)
		}

		// Exam routes (teacher)
		teacherExams := api.Group("/exams")
		teacherExams.Use(middleware.RequireRole("teacher"))
		{
			teacherExams.POST("", handlers.CreateExam)
			teacherExams.GET("", handlers.GetExams)
			teacherExams.GET("/:id", handlers.GetExam)
			teacherExams.PUT("/:id", handlers.UpdateExam)
			teacherExams.DELETE("/:id", handlers.DeleteExam)
			teacherExams.POST("/:id/problems", handlers.AddProblem)
			teacherExams.POST("/:id/assign", handlers.AssignExam)
			teacherExams.GET("/:id/results", handlers.GetExamResults)
			teacherExams.GET("/:id/results/export", handlers.ExportExamResults)
		}

		// Problem routes (teacher)
		teacherProblems := api.Group("/problems")
		teacherProblems.Use(middleware.RequireRole("teacher"))
		{
			teacherProblems.PUT("/:id", handlers.UpdateProblem)
			teacherProblems.DELETE("/:id", handlers.DeleteProblem)
			teacherProblems.POST("/:id/test-cases", handlers.AddTestCase)
		}

		// Test case routes (teacher)
		teacherTestCases := api.Group("/test-cases")
		teacherTestCases.Use(middleware.RequireRole("teacher"))
		{
			teacherTestCases.PUT("/:id", handlers.UpdateTestCase)
			teacherTestCases.DELETE("/:id", handlers.DeleteTestCase)
		}

		// Student routes
		student := api.Group("/student")
		student.Use(middleware.RequireRole("student"))
		{
			student.POST("/classes/join", handlers.JoinClass)
			student.GET("/classes", handlers.GetStudentClasses)
			student.GET("/exams", handlers.GetStudentExams)
			student.GET("/exams/:id", handlers.GetStudentExam)
			student.GET("/submissions", handlers.GetStudentSubmissions)
		}

		// Submission routes (students submit, anyone with access can view)
		submissions := api.Group("/submissions")
		{
			submissions.POST("", handlers.SubmitSolution)
			submissions.POST("/run", handlers.RunSolution)
			submissions.GET("/:id", handlers.GetSubmission)
		}
	}

	r.Run(":8080")
}
