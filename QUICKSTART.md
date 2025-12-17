# Quick Start Guide

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB of free disk space
- Ports 3002, 8081, and 5434 available

## Getting Started

### 1. Start the Application

```bash
cd financial-reporting-system
docker-compose up --build
```

**First run notes:**
- Initial build takes 2-3 minutes
- Database seed data generation takes 2-3 minutes (100k+ transactions)
- Wait for "Ready" messages before accessing the application

### 2. Access the Application

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:8081
- **Demo Credentials**: 
  - Username: `demo`
  - Password: `demo123`

### 3. Using Make Commands (Optional)

```bash
# Build all services
make build

# Start services in background
make up

# View logs
make logs

# Stop services
make down

# Reset database (WARNING: deletes all data)
make reset-db
```

## Testing Performance

1. Login to the application
2. Navigate to the Dashboard to see cached reports
3. Go to Reports page
4. Change date range and click "Generate Report"
5. Notice execution time on first call vs cached calls

## Expected Performance

- **First call**: 80-180ms (depending on report type)
- **Cached call**: 5-10ms
- **Parallel reports**: ~195ms for all 3 reports

## Troubleshooting

### Port already in use
```bash
# Change ports in docker-compose.yml or stop conflicting services
```

### Database connection errors
```bash
# Wait for postgres to be healthy (check with: docker-compose ps)
# Or reset: make reset-db
```

### Build errors
```bash
# Clean and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## Stopping the Application

```bash
docker-compose down
```

To also remove volumes (deletes database data):
```bash
docker-compose down -v
```

