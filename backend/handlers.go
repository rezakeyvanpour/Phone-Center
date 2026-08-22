package main

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var jwtSecret = []byte("replace-with-secure-secret")

func init() {
	if s := os.Getenv("JWT_SECRET"); s != "" {
		jwtSecret = []byte(s)
	}
}

func respondError(c *gin.Context, code int, msg string) {
	c.JSON(code, gin.H{"error": msg})
}

func LoginHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payload struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := c.ShouldBindJSON(&payload); err != nil {
			respondError(c, http.StatusBadRequest, "invalid payload")
			return
		}
		var user User
		if err := db.Where("email = ?", payload.Email).First(&user).Error; err != nil {
			respondError(c, http.StatusUnauthorized, "invalid credentials")
			return
		}
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(payload.Password)); err != nil {
			respondError(c, http.StatusUnauthorized, "invalid credentials")
			return
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub": user.ID,
			"exp": time.Now().Add(24 * time.Hour).Unix(),
			"iat": time.Now().Unix(),
		})
		tok, err := token.SignedString(jwtSecret)
		if err != nil {
			respondError(c, http.StatusInternalServerError, "could not create token")
			return
		}
		c.JSON(http.StatusOK, gin.H{"token": tok})
	}
}

func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			respondError(c, http.StatusUnauthorized, "missing token")
			c.Abort()
			return
		}
		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrTokenMalformed
			}
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			respondError(c, http.StatusUnauthorized, "invalid token")
			c.Abort()
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			respondError(c, http.StatusUnauthorized, "invalid token claims")
			c.Abort()
			return
		}
		c.Set("user", claims["sub"])
		c.Next()
	}
}

// Products handlers
func GetProductsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var products []Product
		if err := db.Find(&products).Error; err != nil {
			respondError(c, http.StatusInternalServerError, "could not fetch products")
			return
		}
		c.JSON(http.StatusOK, products)
	}
}

func GetProductHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var product Product
		if err := db.First(&product, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				respondError(c, http.StatusNotFound, "product not found")
				return
			}
			respondError(c, http.StatusInternalServerError, "could not fetch product")
			return
		}
		c.JSON(http.StatusOK, product)
	}
}

func CreateProductHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payload Product
		if err := c.ShouldBindJSON(&payload); err != nil {
			respondError(c, http.StatusBadRequest, "invalid payload")
			return
		}
		if err := db.Create(&payload).Error; err != nil {
			respondError(c, http.StatusInternalServerError, "could not create product")
			return
		}
		c.JSON(http.StatusCreated, payload)
	}
}

func UpdateProductHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var existing Product
		if err := db.First(&existing, id).Error; err != nil {
			respondError(c, http.StatusNotFound, "product not found")
			return
		}
		var payload Product
		if err := c.ShouldBindJSON(&payload); err != nil {
			respondError(c, http.StatusBadRequest, "invalid payload")
			return
		}
		payload.ID = existing.ID
		if err := db.Save(&payload).Error; err != nil {
			respondError(c, http.StatusInternalServerError, "could not update product")
			return
		}
		c.JSON(http.StatusOK, payload)
	}
}

func DeleteProductHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Delete(&Product{}, id).Error; err != nil {
			respondError(c, http.StatusInternalServerError, "could not delete product")
			return
		}
		c.Status(http.StatusNoContent)
	}
}
