package main

import (
	"crypto/rand"
	"errors"
	"net/http"
	"net/mail"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var jwtSecret []byte

func init() {
	if s := os.Getenv("JWT_SECRET"); s != "" {
		jwtSecret = []byte(s)
	} else {
		// Keep local development convenient without shipping a reusable key.
		jwtSecret = make([]byte, 32)
		if _, err := rand.Read(jwtSecret); err != nil {
			jwtSecret = []byte("local-development-secret-change-me")
		}
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
		email := normalizeEmail(payload.Email)
		if email == "" || payload.Password == "" {
			respondError(c, http.StatusUnauthorized, "invalid credentials")
			return
		}
		if err := db.Where("email = ?", email).First(&user).Error; err != nil {
			respondError(c, http.StatusUnauthorized, "invalid credentials")
			return
		}
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(payload.Password)); err != nil {
			respondError(c, http.StatusUnauthorized, "invalid credentials")
			return
		}
		tok, err := createUserToken(user)
		if err != nil {
			respondError(c, http.StatusInternalServerError, "could not create token")
			return
		}
		c.JSON(http.StatusOK, gin.H{"token": tok, "user": publicUser(user)})
	}
}

func RegisterHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payload struct {
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := c.ShouldBindJSON(&payload); err != nil {
			respondError(c, http.StatusBadRequest, "invalid payload")
			return
		}

		payload.Username = strings.TrimSpace(payload.Username)
		payload.Email = normalizeEmail(payload.Email)
		if err := validateRegistration(payload.Username, payload.Email, payload.Password); err != nil {
			respondError(c, http.StatusBadRequest, err.Error())
			return
		}

		var existing User
		if err := db.Where("email = ? OR username = ?", payload.Email, payload.Username).First(&existing).Error; err == nil {
			if strings.EqualFold(existing.Email, payload.Email) {
				respondError(c, http.StatusConflict, "email is already registered")
			} else {
				respondError(c, http.StatusConflict, "username is already taken")
			}
			return
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			respondError(c, http.StatusInternalServerError, "could not check account")
			return
		}

		passwordHash, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
		if err != nil {
			respondError(c, http.StatusInternalServerError, "could not secure password")
			return
		}
		user := User{
			Username:     payload.Username,
			Email:        payload.Email,
			PasswordHash: string(passwordHash),
		}
		if err := db.Create(&user).Error; err != nil {
			// Unique indexes protect against concurrent duplicate signups.
			if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
				respondError(c, http.StatusConflict, "email or username is already registered")
				return
			}
			respondError(c, http.StatusInternalServerError, "could not create account")
			return
		}

		token, err := createUserToken(user)
		if err != nil {
			respondError(c, http.StatusInternalServerError, "account created but could not create token")
			return
		}
		c.JSON(http.StatusCreated, gin.H{"token": token, "user": publicUser(user)})
	}
}

func CurrentUserHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := c.Get("userID")
		if !ok {
			respondError(c, http.StatusUnauthorized, "invalid token claims")
			return
		}
		var user User
		if err := db.First(&user, userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				respondError(c, http.StatusUnauthorized, "user not found")
				return
			}
			respondError(c, http.StatusInternalServerError, "could not fetch user")
			return
		}
		c.JSON(http.StatusOK, gin.H{"user": publicUser(user)})
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
		userID, ok := tokenUserID(claims["sub"])
		if !ok {
			respondError(c, http.StatusUnauthorized, "invalid token subject")
			c.Abort()
			return
		}
		c.Set("user", userID)
		c.Set("userID", userID)
		c.Next()
	}
}

func tokenUserID(value interface{}) (uint, bool) {
	switch v := value.(type) {
	case float64:
		if v > 0 && v == float64(uint(v)) {
			return uint(v), true
		}
	case string:
		id, err := strconv.ParseUint(v, 10, 64)
		if err == nil && id > 0 {
			return uint(id), true
		}
	case uint:
		if v > 0 {
			return v, true
		}
	case uint64:
		if v > 0 {
			return uint(v), true
		}
	}
	return 0, false
}

func createUserToken(user User) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      user.ID,
		"username": user.Username,
		"email":    user.Email,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	})
	return token.SignedString(jwtSecret)
}

func publicUser(user User) gin.H {
	return gin.H{
		"id":        user.ID,
		"username":  user.Username,
		"email":     user.Email,
		"createdAt": user.CreatedAt,
	}
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func validateRegistration(username, email, password string) error {
	if len(username) < 3 || len(username) > 100 {
		return errors.New("username must be between 3 and 100 characters")
	}
	if _, err := mail.ParseAddress(email); err != nil {
		return errors.New("invalid email address")
	}
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	if len(password) > 72 {
		return errors.New("password must be at most 72 characters")
	}
	return nil
}

// Products handlers
func GetProductsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var products []Product
		query := db.Order("id asc")
		if category := strings.TrimSpace(c.Query("category")); category != "" && category != "all" {
			query = query.Where("category = ?", category)
		}
		if search := strings.TrimSpace(c.Query("q")); search != "" {
			like := "%" + search + "%"
			query = query.Where("name LIKE ? OR spec LIKE ? OR category LIKE ?", like, like, like)
		}
		if limit, err := strconv.Atoi(c.DefaultQuery("limit", "0")); err == nil && limit > 0 {
			if limit > 100 {
				limit = 100
			}
			query = query.Limit(limit)
		}
		if offset, err := strconv.Atoi(c.DefaultQuery("offset", "0")); err == nil && offset > 0 {
			query = query.Offset(offset)
		}
		if err := query.Find(&products).Error; err != nil {
			respondError(c, http.StatusInternalServerError, "could not fetch products")
			return
		}
		c.JSON(http.StatusOK, products)
	}
}

func GetProductHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			respondError(c, http.StatusBadRequest, "invalid product id")
			return
		}
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
		if strings.TrimSpace(payload.Name) == "" || payload.Price < 0 {
			respondError(c, http.StatusBadRequest, "name and a non-negative price are required")
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
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			respondError(c, http.StatusBadRequest, "invalid product id")
			return
		}
		var existing Product
		if err := db.First(&existing, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				respondError(c, http.StatusNotFound, "product not found")
			} else {
				respondError(c, http.StatusInternalServerError, "could not fetch product")
			}
			return
		}
		var payload Product
		if err := c.ShouldBindJSON(&payload); err != nil {
			respondError(c, http.StatusBadRequest, "invalid payload")
			return
		}
		if strings.TrimSpace(payload.Name) == "" || payload.Price < 0 {
			respondError(c, http.StatusBadRequest, "name and a non-negative price are required")
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
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			respondError(c, http.StatusBadRequest, "invalid product id")
			return
		}
		result := db.Delete(&Product{}, id)
		if result.Error != nil {
			respondError(c, http.StatusInternalServerError, "could not delete product")
			return
		}
		if result.RowsAffected == 0 {
			respondError(c, http.StatusNotFound, "product not found")
			return
		}
		c.Status(http.StatusNoContent)
	}
}
