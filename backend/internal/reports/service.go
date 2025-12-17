package reports

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"financial-reporting-system/internal/cache"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	db    *pgxpool.Pool
	cache *cache.Cache
}

func NewService(db *pgxpool.Pool, cache *cache.Cache) *Service {
	return &Service{
		db:    db,
		cache: cache,
	}
}

type ProfitLossRow struct {
	CategoryName   string  `json:"category_name"`
	CategoryType   string  `json:"category_type"`
	TotalAmount    float64 `json:"total_amount"`
	TransactionCount int64 `json:"transaction_count"`
}

type ProfitLossResponse struct {
	Data           []ProfitLossRow `json:"data"`
	ExecutionTimeMs int64          `json:"execution_time_ms"`
	Cached          bool           `json:"cached"`
}

type RevenueByCategoryRow struct {
	CategoryName      string  `json:"category_name"`
	RevenueAmount     float64 `json:"revenue_amount"`
	TransactionCount  int64   `json:"transaction_count"`
	AverageTransaction float64 `json:"average_transaction"`
}

type RevenueByCategoryResponse struct {
	Data           []RevenueByCategoryRow `json:"data"`
	ExecutionTimeMs int64                `json:"execution_time_ms"`
	Cached          bool                 `json:"cached"`
}

type TopCustomerRow struct {
	CustomerID        string  `json:"customer_id"`
	CustomerName      string  `json:"customer_name"`
	TotalRevenue      float64 `json:"total_revenue"`
	TransactionCount  int64   `json:"transaction_count"`
	AverageTransaction float64 `json:"average_transaction"`
}

type TopCustomersResponse struct {
	Data           []TopCustomerRow `json:"data"`
	ExecutionTimeMs int64          `json:"execution_time_ms"`
	Cached          bool           `json:"cached"`
}

func (s *Service) GetProfitLoss(ctx context.Context, startDate, endDate time.Time) (*ProfitLossResponse, error) {
	start := time.Now()
	cacheKey := fmt.Sprintf("profit_loss:%s:%s", startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))

	// Check cache
	if cached, found := s.cache.Get(cacheKey); found {
		if data, ok := cached.(*ProfitLossResponse); ok {
			data.Cached = true
			data.ExecutionTimeMs = time.Since(start).Milliseconds()
			return data, nil
		}
	}

	// Execute stored procedure
	rows, err := s.db.Query(ctx, "SELECT * FROM sp_profit_loss($1, $2)", startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to execute stored procedure: %w", err)
	}
	defer rows.Close()

	var results []ProfitLossRow
	for rows.Next() {
		var row ProfitLossRow
		err := rows.Scan(&row.CategoryName, &row.CategoryType, &row.TotalAmount, &row.TransactionCount)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		results = append(results, row)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	executionTime := time.Since(start)
	response := &ProfitLossResponse{
		Data:            results,
		ExecutionTimeMs: executionTime.Milliseconds(),
		Cached:          false,
	}

	// Cache the result
	s.cache.Set(cacheKey, response)

	return response, nil
}

func (s *Service) GetRevenueByCategory(ctx context.Context, startDate, endDate time.Time) (*RevenueByCategoryResponse, error) {
	start := time.Now()
	cacheKey := fmt.Sprintf("revenue_category:%s:%s", startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))

	// Check cache
	if cached, found := s.cache.Get(cacheKey); found {
		if data, ok := cached.(*RevenueByCategoryResponse); ok {
			data.Cached = true
			data.ExecutionTimeMs = time.Since(start).Milliseconds()
			return data, nil
		}
	}

	// Execute stored procedure
	rows, err := s.db.Query(ctx, "SELECT * FROM sp_revenue_by_category($1, $2)", startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to execute stored procedure: %w", err)
	}
	defer rows.Close()

	var results []RevenueByCategoryRow
	for rows.Next() {
		var row RevenueByCategoryRow
		err := rows.Scan(&row.CategoryName, &row.RevenueAmount, &row.TransactionCount, &row.AverageTransaction)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		results = append(results, row)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	executionTime := time.Since(start)
	response := &RevenueByCategoryResponse{
		Data:            results,
		ExecutionTimeMs: executionTime.Milliseconds(),
		Cached:          false,
	}

	// Cache the result
	s.cache.Set(cacheKey, response)

	return response, nil
}

func (s *Service) GetTopCustomers(ctx context.Context, startDate, endDate time.Time, limit int) (*TopCustomersResponse, error) {
	start := time.Now()
	cacheKey := fmt.Sprintf("top_customers:%s:%s:%d", startDate.Format("2006-01-02"), endDate.Format("2006-01-02"), limit)

	// Check cache
	if cached, found := s.cache.Get(cacheKey); found {
		if data, ok := cached.(*TopCustomersResponse); ok {
			data.Cached = true
			data.ExecutionTimeMs = time.Since(start).Milliseconds()
			return data, nil
		}
	}

	// Execute stored procedure
	rows, err := s.db.Query(ctx, "SELECT * FROM sp_top_customers($1, $2, $3)", startDate, endDate, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to execute stored procedure: %w", err)
	}
	defer rows.Close()

	var results []TopCustomerRow
	for rows.Next() {
		var row TopCustomerRow
		var customerID sql.NullString
		err := rows.Scan(&customerID, &row.CustomerName, &row.TotalRevenue, &row.TransactionCount, &row.AverageTransaction)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		if customerID.Valid {
			row.CustomerID = customerID.String
		}
		results = append(results, row)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	executionTime := time.Since(start)
	response := &TopCustomersResponse{
		Data:            results,
		ExecutionTimeMs: executionTime.Milliseconds(),
		Cached:          false,
	}

	// Cache the result
	s.cache.Set(cacheKey, response)

	return response, nil
}

// GetMultipleReportsParallel runs multiple reports in parallel using goroutines
func (s *Service) GetMultipleReportsParallel(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error) {
	start := time.Now()
	type result struct {
		name string
		data interface{}
		err  error
	}

	resultsChan := make(chan result, 3)

	// Run reports in parallel
	go func() {
		data, err := s.GetProfitLoss(ctx, startDate, endDate)
		resultsChan <- result{name: "profit_loss", data: data, err: err}
	}()

	go func() {
		data, err := s.GetRevenueByCategory(ctx, startDate, endDate)
		resultsChan <- result{name: "revenue_category", data: data, err: err}
	}()

	go func() {
		data, err := s.GetTopCustomers(ctx, startDate, endDate, 10)
		resultsChan <- result{name: "top_customers", data: data, err: err}
	}()

	// Collect results
	results := make(map[string]interface{})
	for i := 0; i < 3; i++ {
		res := <-resultsChan
		if res.err != nil {
			return nil, fmt.Errorf("error in %s: %w", res.name, res.err)
		}
		results[res.name] = res.data
	}

	executionTime := time.Since(start)
	results["total_execution_time_ms"] = executionTime.Milliseconds()

	return results, nil
}

