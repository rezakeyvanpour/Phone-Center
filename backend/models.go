package main

import (
	"gorm.io/gorm"
)

type Product struct {
	ID             uint     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name           string   `gorm:"type:varchar(255);not null" json:"name"`
	Price          int64    `gorm:"type:bigint;not null" json:"price"`
	Spec           string   `gorm:"type:text" json:"spec"`
	Image          string   `gorm:"type:varchar(1024)" json:"image"`
	Category       string   `gorm:"type:varchar(100)" json:"category"`
	Badge          string   `gorm:"type:varchar(100)" json:"badge"`
	Colors         []string `gorm:"type:json;serializer:json" json:"colors"`
	StorageOptions []string `gorm:"type:json;serializer:json" json:"storageOptions"`
	RamOptions     []string `gorm:"type:json;serializer:json" json:"ramOptions"`
	Region         string   `gorm:"type:varchar(100)" json:"region"`
	gorm.Model
}

type User struct {
	ID           uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Username     string `gorm:"type:varchar(100);uniqueIndex;not null" json:"username"`
	Email        string `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string `gorm:"type:varchar(255);not null" json:"-"`
}
