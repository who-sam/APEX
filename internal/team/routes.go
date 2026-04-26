package team

import "github.com/gin-gonic/gin"

func RegisterRoutes(public, protected *gin.RouterGroup) {
	protected.GET("/teams", GetTeams)
	protected.GET("/teams/:id", GetTeam)
	protected.POST("/teams", CreateTeam)
	protected.POST("/teams/:id/members", AddMember)
}
