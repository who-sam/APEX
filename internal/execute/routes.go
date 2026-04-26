package execute

import "github.com/gin-gonic/gin"

func RegisterRoutes(public, protected *gin.RouterGroup) {
	protected.POST("/execute", Execute)
}
