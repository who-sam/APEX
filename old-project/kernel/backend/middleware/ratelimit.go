package middleware

import (
	"fmt"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type limiterStore struct {
	mu       sync.Mutex
	limiters map[string]*rate.Limiter
	rps      rate.Limit
	burst    int
}

func newLimiterStore(rps float64, burst int) *limiterStore {
	return &limiterStore{
		limiters: make(map[string]*rate.Limiter),
		rps:      rate.Limit(rps),
		burst:    burst,
	}
}

func (s *limiterStore) get(key string) *rate.Limiter {
	s.mu.Lock()
	defer s.mu.Unlock()
	l, ok := s.limiters[key]
	if !ok {
		l = rate.NewLimiter(s.rps, s.burst)
		s.limiters[key] = l
	}
	return l
}

func IPRateLimiter(rps float64, burst int) gin.HandlerFunc {
	store := newLimiterStore(rps, burst)
	return func(c *gin.Context) {
		ip := c.ClientIP()
		if !store.get(ip).Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "too many requests"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func UserRateLimiter(rps float64, burst int) gin.HandlerFunc {
	store := newLimiterStore(rps, burst)
	return func(c *gin.Context) {
		uid, exists := c.Get("user_id")
		if !exists {
			c.Next()
			return
		}
		key := fmt.Sprintf("%v", uid)
		if !store.get(key).Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "too many requests"})
			c.Abort()
			return
		}
		c.Next()
	}
}
