package auth

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	db     *pgxpool.Pool
	secret []byte
}

func NewService(db *pgxpool.Pool, jwtSecret string) *Service {
	return &Service{
		db:     db,
		secret: []byte(jwtSecret),
	}
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (*LoginResponse, error) {
	var userID, username, passwordHash string
	var email sql.NullString

	// Get user from database
	// Note: Using search_path from connection string to determine schema
	err := s.db.QueryRow(ctx,
		`SELECT id, username, password_hash, email FROM users WHERE username = $1`,
		req.Username,
	).Scan(&userID, &username, &passwordHash, &email)

	if err != nil {
		log.Printf("Login failed - user not found: %s, error: %v", req.Username, err)
		return nil, errors.New("invalid credentials")
	}

	log.Printf("User found: %s, hash length: %d", username, len(passwordHash))

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password))
	if err != nil {
		log.Printf("Login failed - password mismatch for user: %s", username)
		return nil, errors.New("invalid credentials")
	}

	log.Printf("Login successful for user: %s", username)

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	})

	tokenString, err := token.SignedString(s.secret)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	emailStr := ""
	if email.Valid {
		emailStr = email.String
	}

	return &LoginResponse{
		Token: tokenString,
		User: User{
			ID:       userID,
			Username: username,
			Email:    emailStr,
		},
	}, nil
}

func (s *Service) VerifyToken(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return s.secret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return token, nil
}

