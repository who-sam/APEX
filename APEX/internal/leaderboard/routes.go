package leaderboard

import "github.com/gin-gonic/gin"

func RegisterRoutes(public, protected *gin.RouterGroup) {
	protected.GET("/leaderboard", GetClassLeaderboard)
	protected.GET("/leaderboard/global", GetGlobalLeaderboard)
}
