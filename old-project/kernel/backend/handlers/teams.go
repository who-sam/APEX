package handlers

import (
	"kernel-backend/database"
	"kernel-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetTeams(c *gin.Context) {
	userID := c.GetUint("user_id")
	var memberOf []models.TeamMember
	database.DB.Where("user_id = ?", userID).Find(&memberOf)

	if len(memberOf) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	teamIDs := make([]uint, len(memberOf))
	for i, m := range memberOf {
		teamIDs[i] = m.TeamID
	}

	var teams []models.Team
	database.DB.Where("id IN ?", teamIDs).Preload("Members.User").Find(&teams)
	c.JSON(http.StatusOK, teams)
}

func GetTeam(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	var team models.Team
	if err := database.DB.Preload("Members.User").First(&team, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "team not found"})
		return
	}

	// Verify membership
	isMember := false
	for _, m := range team.Members {
		if m.UserID == userID {
			isMember = true
			break
		}
	}
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "not a member of this team"})
		return
	}
	c.JSON(http.StatusOK, team)
}

func CreateTeam(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req struct {
		Name    string `json:"name" binding:"required"`
		ClassID uint   `json:"class_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	if len(req.Name) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name must be at most 255 characters"})
		return
	}

	team := models.Team{Name: req.Name, ClassID: req.ClassID}
	if err := database.DB.Create(&team).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create team"})
		return
	}

	// Add creator as admin
	database.DB.Create(&models.TeamMember{
		TeamID: team.ID,
		UserID: userID,
		Role:   "admin",
	})

	database.DB.Preload("Members.User").First(&team, team.ID)
	c.JSON(http.StatusCreated, team)
}

func AddTeamMember(c *gin.Context) {
	userID := c.GetUint("user_id")
	teamID := c.Param("id")

	var team models.Team
	if err := database.DB.Preload("Members").First(&team, teamID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "team not found"})
		return
	}

	// Verify requester is admin
	isAdmin := false
	for _, m := range team.Members {
		if m.UserID == userID && m.Role == "admin" {
			isAdmin = true
			break
		}
	}
	if !isAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "only team admins can add members"})
		return
	}

	var req struct {
		UserID uint `json:"user_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	// Check for duplicate
	for _, m := range team.Members {
		if m.UserID == req.UserID {
			c.JSON(http.StatusConflict, gin.H{"error": "user is already a member"})
			return
		}
	}

	member := models.TeamMember{TeamID: team.ID, UserID: req.UserID, Role: "member"}
	database.DB.Create(&member)
	c.JSON(http.StatusCreated, member)
}
