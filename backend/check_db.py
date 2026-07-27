import sqlite3

conn = sqlite3.connect("expenses.db")
cursor = conn.cursor()

try:
    cursor.execute(
        "ALTER TABLE users ADD COLUMN income REAL DEFAULT 0"
    )

    conn.commit()
    print("✅ income column added successfully!")

except Exception as e:
    print(e)

conn.close()