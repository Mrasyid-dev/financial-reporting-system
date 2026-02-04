-- Seed Data for Financial Reporting System

-- Insert categories
INSERT INTO categories (id, name, type, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Sales Revenue', 'revenue', 'Revenue from product sales'),
    ('22222222-2222-2222-2222-222222222222', 'Service Revenue', 'revenue', 'Revenue from services'),
    ('33333333-3333-3333-3333-333333333333', 'Other Revenue', 'revenue', 'Other revenue sources'),
    ('44444444-4444-4444-4444-444444444444', 'Cost of Goods Sold', 'expense', 'Direct costs of products sold'),
    ('55555555-5555-5555-5555-555555555555', 'Operating Expenses', 'expense', 'General operating expenses'),
    ('66666666-6666-6666-6666-666666666666', 'Salaries & Wages', 'expense', 'Employee compensation'),
    ('77777777-7777-7777-7777-777777777777', 'Marketing', 'expense', 'Marketing and advertising costs'),
    ('88888888-8888-8888-8888-888888888888', 'Utilities', 'expense', 'Utility expenses');

-- Insert accounts (Chart of Accounts)
INSERT INTO accounts (id, code, name, type) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1000', 'Cash', 'asset'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '1100', 'Accounts Receivable', 'asset'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '4000', 'Sales Revenue', 'revenue'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '4100', 'Service Revenue', 'revenue'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '5000', 'Cost of Goods Sold', 'expense'),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', '6000', 'Operating Expenses', 'expense'),
    ('10101010-1010-1010-1010-101010101010', '6100', 'Salaries Expense', 'expense'),
    ('20202020-2020-2020-2020-202020202020', '6200', 'Marketing Expense', 'expense'),
    ('30303030-3030-3030-3030-303030303030', '6300', 'Utilities Expense', 'expense');

-- Insert customers (will generate 1000 customers)
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..1000 LOOP
        INSERT INTO customers (id, name, email, phone) VALUES
        (
            gen_random_uuid(),
            'Customer ' || i,
            'customer' || i || '@example.com',
            '+1-555-' || LPAD(i::TEXT, 4, '0')
        );
    END LOOP;
END $$;

-- Insert demo user (password: demo123, hashed with bcrypt)
-- For demo: password is "demo123"
-- This is a valid bcrypt hash for "demo123"
INSERT INTO users (id, username, password_hash, email) VALUES
    ('99999999-9999-9999-9999-999999999999', 'demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'demo@example.com');

-- Generate transactions and transaction items (100,000+ transactions)
-- This will take a few moments but generates realistic data
DO $$
DECLARE
    trans_id UUID;
    customer_uuid UUID;
    account_uuid UUID;
    category_uuid UUID;
    trans_date DATE;
    trans_type VARCHAR(50);
    amount DECIMAL(15, 2);
    i INTEGER;
    j INTEGER;
    num_days INTEGER;
    transactions_per_day INTEGER;
BEGIN
    -- Generate transactions over the past 365 days
    num_days := 365;
    transactions_per_day := 275; -- ~100k transactions total
    
    FOR i IN 0..(num_days - 1) LOOP
        trans_date := CURRENT_DATE - (num_days - i);
        
        FOR j IN 1..transactions_per_day LOOP
            -- Get random customer
            SELECT id INTO customer_uuid FROM customers ORDER BY RANDOM() LIMIT 1;
            
            -- Random transaction type
            trans_type := CASE (RANDOM() * 4)::INT
                WHEN 0 THEN 'sale'
                WHEN 1 THEN 'receipt'
                WHEN 2 THEN 'purchase'
                WHEN 3 THEN 'payment'
                ELSE 'adjustment'
            END;
            
            -- Random amount between 10 and 10000
            amount := 10 + (RANDOM() * 9990);
            
            -- Create transaction
            INSERT INTO transactions (id, transaction_date, reference_number, description, transaction_type, customer_id, total_amount)
            VALUES (
                gen_random_uuid(),
                trans_date,
                'REF-' || TO_CHAR(trans_date, 'YYYYMMDD') || '-' || LPAD(j::TEXT, 6, '0'),
                'Transaction ' || trans_date || ' #' || j,
                trans_type,
                CASE WHEN trans_type IN ('sale', 'receipt') THEN customer_uuid ELSE NULL END,
                amount
            ) RETURNING id INTO trans_id;
            
            -- For sales/receipts: debit Cash/AR, credit Revenue
            IF trans_type IN ('sale', 'receipt') THEN
                -- Get cash account
                SELECT id INTO account_uuid FROM accounts WHERE code = '1000';
                -- Debit cash
                INSERT INTO transaction_items (transaction_id, account_id, category_id, debit, credit, description)
                VALUES (trans_id, account_uuid, NULL, amount, 0, 'Cash receipt');
                
                -- Get revenue category and account
                SELECT id INTO category_uuid FROM categories WHERE type = 'revenue' ORDER BY RANDOM() LIMIT 1;
                SELECT id INTO account_uuid FROM accounts WHERE type = 'revenue' ORDER BY RANDOM() LIMIT 1;
                -- Credit revenue
                INSERT INTO transaction_items (transaction_id, account_id, category_id, debit, credit, description)
                VALUES (trans_id, account_uuid, category_uuid, 0, amount, 'Revenue');
            
            -- For purchases/payments: debit Expense, credit Cash
            ELSIF trans_type IN ('purchase', 'payment') THEN
                -- Get expense category and account
                SELECT id INTO category_uuid FROM categories WHERE type = 'expense' ORDER BY RANDOM() LIMIT 1;
                SELECT id INTO account_uuid FROM accounts WHERE type = 'expense' ORDER BY RANDOM() LIMIT 1;
                -- Debit expense
                INSERT INTO transaction_items (transaction_id, account_id, category_id, debit, credit, description)
                VALUES (trans_id, account_uuid, category_uuid, amount, 0, 'Expense');
                
                -- Get cash account
                SELECT id INTO account_uuid FROM accounts WHERE code = '1000';
                -- Credit cash
                INSERT INTO transaction_items (transaction_id, account_id, category_id, debit, credit, description)
                VALUES (trans_id, account_uuid, NULL, 0, amount, 'Cash payment');
            END IF;
        END LOOP;
        
        -- Progress indicator every 30 days
        IF i % 30 = 0 THEN
            RAISE NOTICE 'Generated transactions for day %', i;
        END IF;
    END LOOP;
END $$;

-- Update statistics for query optimizer
ANALYZE transactions;
ANALYZE transaction_items;
ANALYZE customers;
ANALYZE categories;
ANALYZE accounts;

