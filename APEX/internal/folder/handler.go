package folder

import (
	"apex/internal/database"
	"apex/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(public *gin.RouterGroup, protected *gin.RouterGroup) {
	protected.GET("/folders", GetFolders)
	protected.POST("/folders", CreateFolder)
	protected.PUT("/folders/:id", UpdateFolder)
	protected.DELETE("/folders/:id", DeleteFolder)
}

func GetFolders(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	var folders []models.Folder
	database.DB.Where("teacher_id = ?", teacherID).Order("created_at desc").Find(&folders)
	c.JSON(http.StatusOK, folders)
}

type CreateFolderReq struct {
	Name string `json:"name" binding:"required"`
}

func CreateFolder(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	var req CreateFolderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	folder := models.Folder{
		TeacherID: teacherID,
		Name:      req.Name,
	}
	if err := database.DB.Create(&folder).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create folder"})
		return
	}
	c.JSON(http.StatusCreated, folder)
}

func UpdateFolder(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid folder id"})
		return
	}
	var req CreateFolderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	var folder models.Folder
	if err := database.DB.First(&folder, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "folder not found"})
		return
	}
	if folder.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}
	if err := database.DB.Model(&folder).Update("name", req.Name).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update folder"})
		return
	}
	c.JSON(http.StatusOK, folder)
}

func DeleteFolder(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid folder id"})
		return
	}
	var folder models.Folder
	if err := database.DB.First(&folder, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "folder not found"})
		return
	}
	if folder.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}
	if err := database.DB.Delete(&folder).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete folder"})
		return
	}
	
	// Set folder_id to null for orphaned problems
	database.DB.Model(&models.Problem{}).Where("folder_id = ?", id).Update("folder_id", nil)
	
	c.JSON(http.StatusOK, gin.H{"message": "folder deleted"})
}
