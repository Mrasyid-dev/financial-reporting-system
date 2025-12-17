-- Stored Procedures for Financial Reports

-- Profit & Loss Report
-- This procedure calculates profit and loss for a given date range
CREATE OR REPLACE FUNCTION sp_profit_loss(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    category_name VARCHAR(255),
    category_type VARCHAR(50),
    total_amount DECIMAL(15, 2),
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.name AS category_name,
        c.type AS category_type,
        COALESCE(
            SUM(CASE 
                WHEN c.type = 'revenue' THEN ti.credit - ti.debit
                WHEN c.type = 'expense' THEN ti.debit - ti.credit
                ELSE 0
            END), 
            0
        ) AS total_amount,
        COUNT(DISTINCT t.id) AS transaction_count
    FROM categories c
    LEFT JOIN transaction_items ti ON ti.category_id = c.id
    LEFT JOIN transactions t ON ti.transaction_id = t.id 
        AND t.transaction_date >= start_date 
        AND t.transaction_date <= end_date
    WHERE c.type IN ('revenue', 'expense')
    GROUP BY c.id, c.name, c.type
    HAVING COALESCE(
        SUM(CASE 
            WHEN c.type = 'revenue' THEN ti.credit - ti.debit
            WHEN c.type = 'expense' THEN ti.debit - ti.credit
            ELSE 0
        END), 
        0
    ) != 0
    ORDER BY c.type, c.name;
END;
$$ LANGUAGE plpgsql;

-- Revenue by Category Report
-- Optimized with direct joins and date filtering
CREATE OR REPLACE FUNCTION sp_revenue_by_category(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    category_name VARCHAR(255),
    revenue_amount DECIMAL(15, 2),
    transaction_count BIGINT,
    average_transaction DECIMAL(15, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.name AS category_name,
        COALESCE(SUM(ti.credit - ti.debit), 0) AS revenue_amount,
        COUNT(DISTINCT t.id) AS transaction_count,
        CASE 
            WHEN COUNT(DISTINCT t.id) > 0 
            THEN COALESCE(SUM(ti.credit - ti.debit), 0) / COUNT(DISTINCT t.id)
            ELSE 0
        END AS average_transaction
    FROM categories c
    INNER JOIN transaction_items ti ON ti.category_id = c.id
    INNER JOIN transactions t ON ti.transaction_id = t.id
    WHERE c.type = 'revenue'
        AND t.transaction_date >= start_date
        AND t.transaction_date <= end_date
        AND ti.credit > 0
    GROUP BY c.id, c.name
    HAVING COALESCE(SUM(ti.credit - ti.debit), 0) > 0
    ORDER BY revenue_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Top Customers Report
-- Returns top customers by transaction volume
CREATE OR REPLACE FUNCTION sp_top_customers(
    start_date DATE,
    end_date DATE,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    customer_id UUID,
    customer_name VARCHAR(255),
    total_revenue DECIMAL(15, 2),
    transaction_count BIGINT,
    average_transaction DECIMAL(15, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS customer_id,
        c.name AS customer_name,
        COALESCE(SUM(t.total_amount), 0) AS total_revenue,
        COUNT(t.id) AS transaction_count,
        CASE 
            WHEN COUNT(t.id) > 0 
            THEN COALESCE(SUM(t.total_amount), 0) / COUNT(t.id)
            ELSE 0
        END AS average_transaction
    FROM customers c
    INNER JOIN transactions t ON t.customer_id = c.id
    WHERE t.transaction_date >= start_date
        AND t.transaction_date <= end_date
        AND t.transaction_type IN ('sale', 'receipt')
    GROUP BY c.id, c.name
    ORDER BY total_revenue DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

