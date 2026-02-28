package handlers

import (
	"codejudge-backend/database"
	"codejudge-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetTeams(c *gin.Context) {
	userID := c.GetUint("user_id")

	// Get team IDs where user is a member
	var teamIDs []uint
	database.DB.Model(&models.TeamMember{}).Where("user_id = ?", userID).Pluck("team_id", &teamIDs)

	if len(teamIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	var teams []models.Team
	database.DB.Where("id IN ?", teamIDs).
		Preload("Members.User").
		Order("created_at desc").
		Find(&teams)

	c.JSON(http.StatusOK, teams)
}

func GetTeam(c *gin.Context) {
	userID := c.GetUint("user_id")
	teamID := c.Param("id")

	// Verify user is a member of this team
	var memberCount int64
	database.DB.Model(&models.TeamMember{}).Where("team_id = ? AND user_id = ?", teamID, userID).Count(&memberCount)
	if memberCount == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "not a member of this team"})
		return
	}

	var team models.Team
	if err := database.DB.Where("id = ?", teamID).
		Preload("Members.User").
		First(&team).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "team not found"})
		return
	}

	c.JSON(http.StatusOK, team)
}

type createTeamRequest struct {
	Name string `json:"name" binding:"required"`
}

func CreateTeam(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req createTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	team := models.Team{
		Name: req.Name,
	}

	if err := database.DB.Create(&team).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create team"})
		return
	}

	// Add current user as admin member
	member := models.TeamMember{
		TeamID: team.ID,
		UserID: userID,
		Role:   "admin",
	}

	if err := database.DB.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add team member"})
		return
	}

	// Reload with members
	database.DB.Where("id = ?", team.ID).Preload("Members.User").First(&team)

	c.JSON(http.StatusCreated, team)
}

type addTeamMemberRequest struct {
	UserID uint `json:"user_id" binding:"required"`
}

func AddTeamMember(c *gin.Context) {
	userID := c.GetUint("user_id")
	teamID := c.Param("id")

	// Verify current user is an admin of this team
	var adminMember models.TeamMember
	if err := database.DB.Where("team_id = ? AND user_id = ? AND role = ?", teamID, userID, "admin").
		First(&adminMember).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "only team admins can add members"})
		return
	}

	var req addTeamMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	// Check if user is already a member
	var existing int64
	database.DB.Model(&models.TeamMember{}).Where("team_id = ? AND user_id = ?", teamID, req.UserID).Count(&existing)
	if existing > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "user is already a member of this team"})
		return
	}

	member := models.TeamMember{
		TeamID: adminMember.TeamID,
		UserID: req.UserID,
		Role:   "member",
	}

	if err := database.DB.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add team member"})
		return
	}

	database.DB.Preload("User").First(&member, member.ID)

	c.JSON(http.StatusCreated, member)
}
