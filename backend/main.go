package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		dsn = "root:138313551360mA@@tcp(127.0.0.1:3306)/phone?charset=utf8&parseTime=True&loc=Local"
	}
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	if err := db.AutoMigrate(&Product{}, &User{}); err != nil {
		log.Fatalf("auto migrate failed: %v", err)
	}

	ensureDefaultUser(db)

	r := gin.Default()

	// Simple CORS
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
		if c.Request.Method == http.MethodOptions {
			c.Status(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Templates + static files. Run from the PROJECT ROOT:  go run ./backend
	// LoadHTMLFiles is used instead of a glob so Base.html.html (which the
	// glob pattern would skip) is loaded too, without renaming anything.
	r.LoadHTMLFiles(
		"templates/Base.html",
		"templates/login/login.html",
		"templates/products/products.html",
		"templates/products/product-detail.html",
	)
	r.Static("/static", "./static")
	r.Static("/assets", "./assets")

	// Page routes
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "Base.html", nil)
	})
	r.GET("/login", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", nil)
	})
	r.GET("/products", func(c *gin.Context) {
		c.HTML(http.StatusOK, "products.html", nil)
	})
	r.GET("/product-detail", func(c *gin.Context) {
		c.HTML(http.StatusOK, "product-detail.html", nil)
	})

	api := r.Group("/api")
	api.GET("/products", GetProductsHandler(db))
	api.GET("/products/:id", GetProductHandler(db))

	// Protected
	protected := api.Group("")
	protected.Use(JWTAuthMiddleware())
	protected.POST("/products", CreateProductHandler(db))
	protected.PUT("/products/:id", UpdateProductHandler(db))
	protected.DELETE("/products/:id", DeleteProductHandler(db))

	r.POST("/login", LoginHandler(db))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("listening on :%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func ensureDefaultUser(db *gorm.DB) {
	var u User
	if err := db.First(&u, "email = ?", "admin@local").Error; err == nil {
		return
	}
	pw := "password"
	hash, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	u = User{Username: "admin", Email: "admin@local", PasswordHash: string(hash)}
	db.Create(&u)
	fmt.Println("created default user: admin@local / password")
}
