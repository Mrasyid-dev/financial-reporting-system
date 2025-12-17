-- Note: Most reports use stored procedures defined in migrations
-- These queries are for direct data access if needed

-- name: GetTransactionSummary :many
SELECT 
    DATE_TRUNC('month', transaction_date) as month,
    transaction_type,
    COUNT(*) as count,
    SUM(total_amount) as total
FROM transactions
WHERE transaction_date >= $1 AND transaction_date <= $2
GROUP BY DATE_TRUNC('month', transaction_date), transaction_type
ORDER BY month, transaction_type;

-- name: GetAccountBalance :one
SELECT 
    a.code,
    a.name,
    COALESCE(SUM(CASE WHEN ti.debit > 0 THEN ti.debit ELSE 0 END), 0) as total_debit,
    COALESCE(SUM(CASE WHEN ti.credit > 0 THEN ti.credit ELSE 0 END), 0) as total_credit,
    COALESCE(SUM(ti.debit - ti.credit), 0) as balance
FROM accounts a
LEFT JOIN transaction_items ti ON ti.account_id = a.id
LEFT JOIN transactions t ON ti.transaction_id = t.id
WHERE a.id = $1
    AND (t.transaction_date IS NULL OR (t.transaction_date >= $2 AND t.transaction_date <= $3))
GROUP BY a.id, a.code, a.name;

