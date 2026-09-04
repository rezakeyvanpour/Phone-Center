package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	dsn := mysqlDSN()
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

	// Templates and assets are configurable for production deployments. By
	// default they are resolved from the current working directory.
	root := os.Getenv("APP_ROOT")
	if root == "" {
		root, _ = os.Getwd()
	}
	templateDir := filepath.Join(root, "templates")
	staticDir := filepath.Join(root, "static")
	assetsDir := filepath.Join(root, "assets")
	r.LoadHTMLFiles(
		filepath.Join(templateDir, "Base.html"),
		filepath.Join(templateDir, "login", "login.html"),
		filepath.Join(templateDir, "products", "products.html"),
		filepath.Join(templateDir, "products", "product-detail.html"),
	)
	r.Static("/static", staticDir)
	r.Static("/assets", assetsDir)

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

	// Keep old URLs working for links/bookmarks from the static version.
	r.GET("/templates/login/login.html", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/login")
	})
	r.GET("/templates/products/products.html", func(c *gin.Context) {
		target := "/products"
		if c.Request.URL.RawQuery != "" {
			target += "?" + c.Request.URL.RawQuery
		}
		c.Redirect(http.StatusMovedPermanently, target)
	})
	r.GET("/templates/products/product-detail.html", func(c *gin.Context) {
		target := "/product-detail"
		if c.Request.URL.RawQuery != "" {
			target += "?" + c.Request.URL.RawQuery
		}
		c.Redirect(http.StatusMovedPermanently, target)
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

func mysqlDSN() string {
	if dsn := os.Getenv("MYSQL_DSN"); dsn != "" {
		return dsn
	}

	user := getenvDefault("MYSQL_USER", "root")
	password := getenvDefault("MYSQL_PASSWORD","138313551360mA@")
	host := getenvDefault("MYSQL_HOST", "127.0.0.1")
	port := getenvDefault("MYSQL_PORT", "3306")
	database := getenvDefault("MYSQL_DATABASE", "phone")
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		user, password, host, port, database)
}

func getenvDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
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
