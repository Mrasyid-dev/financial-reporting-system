-- name: GetUserByUsername :one
SELECT id, username, password_hash, email, created_at, updated_at
FROM users
WHERE username = $1
LIMIT 1;

-- name: GetUserByID :one
SELECT id, username, password_hash, email, created_at, updated_at
FROM users
WHERE id = $1
LIMIT 1;

