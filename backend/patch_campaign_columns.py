import psycopg2

STATEMENTS = [
    # campaigns
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS subject VARCHAR",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS html_template TEXT",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS department_id INTEGER",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_department_id INTEGER",
    "UPDATE campaigns SET department_id = 1 WHERE department_id IS NULL",
    "ALTER TABLE campaigns ALTER COLUMN department_id SET NOT NULL",
    # campaign_sends
    "ALTER TABLE campaign_sends ADD COLUMN IF NOT EXISTS user_id INTEGER",
    "ALTER TABLE campaign_sends ADD COLUMN IF NOT EXISTS token VARCHAR",
    "UPDATE campaign_sends SET user_id = 1 WHERE user_id IS NULL",
    "ALTER TABLE campaign_sends ALTER COLUMN user_id SET NOT NULL",
]

FK_STATEMENTS = [
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'campaigns_department_id_fkey'
              AND table_name = 'campaigns'
        ) THEN
            ALTER TABLE campaigns
            ADD CONSTRAINT campaigns_department_id_fkey
            FOREIGN KEY (department_id) REFERENCES departments(id);
        END IF;
    END $$;
    """,
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'campaigns_target_department_id_fkey'
              AND table_name = 'campaigns'
        ) THEN
            ALTER TABLE campaigns
            ADD CONSTRAINT campaigns_target_department_id_fkey
            FOREIGN KEY (target_department_id) REFERENCES departments(id);
        END IF;
    END $$;
    """,
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'campaign_sends_user_id_fkey'
              AND table_name = 'campaign_sends'
        ) THEN
            ALTER TABLE campaign_sends
            ADD CONSTRAINT campaign_sends_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id);
        END IF;
    END $$;
    """,
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'campaign_sends_campaign_id_fkey'
              AND table_name = 'campaign_sends'
        ) THEN
            ALTER TABLE campaign_sends
            ADD CONSTRAINT campaign_sends_campaign_id_fkey
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id);
        END IF;
    END $$;
    """,
]

def main():
    conn = psycopg2.connect(host="localhost", user="postgres", password="123456", dbname="safeclicker")
    conn.autocommit = True
    cur = conn.cursor()
    try:
        for stmt in STATEMENTS + FK_STATEMENTS:
            print(f"Executing: {stmt.splitlines()[0][:60]}")
            cur.execute(stmt)
        print("Done.")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
