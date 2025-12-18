# PowerShell script to replace Makefile for Windows
param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "Usage: .\make.ps1 [command]"
    Write-Host ""
    Write-Host "Available commands:"
    Write-Host "  build         - Build all Docker images"
    Write-Host "  up            - Start all services"
    Write-Host "  down          - Stop all services"
    Write-Host "  restart       - Restart all services"
    Write-Host "  logs          - Show logs from all services"
    Write-Host "  logs-backend  - Show backend logs"
    Write-Host "  logs-frontend - Show frontend logs"
    Write-Host "  logs-db       - Show database logs"
    Write-Host "  clean         - Remove all containers, volumes, and images"
    Write-Host "  reset-db      - Reset database (WARNING: deletes all data)"
    Write-Host "  ps            - Show running containers"
    Write-Host "  help          - Show this help message"
}

switch ($Command.ToLower()) {
    "build" {
        docker-compose build
    }
    "up" {
        docker-compose up -d
    }
    "down" {
        docker-compose down
    }
    "restart" {
        docker-compose restart
    }
    "logs" {
        docker-compose logs -f
    }
    "logs-backend" {
        docker-compose logs -f backend
    }
    "logs-frontend" {
        docker-compose logs -f frontend
    }
    "logs-db" {
        docker-compose logs -f postgres
    }
    "clean" {
        docker-compose down -v --rmi all
    }
    "reset-db" {
        docker-compose down -v
        docker-compose up -d postgres
        Start-Sleep -Seconds 5
        docker-compose up -d
    }
    "ps" {
        docker-compose ps
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "Unknown command: $Command"
        Write-Host ""
        Show-Help
    }
}

