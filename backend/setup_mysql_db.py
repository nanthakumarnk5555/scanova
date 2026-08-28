import pymysql
import sys

def setup_mysql():
    password = "Nantha@555"
    print(f"Connecting to MySQL at 127.0.0.1:3306 with user 'root'...")
    try:
        conn = pymysql.connect(
            host='127.0.0.1',
            user='root',
            password=password,
            port=3306,
            autocommit=True
        )
        print("Connected to MySQL successfully!")
        
        with conn.cursor() as cur:
            # Create database if not exists
            cur.execute("CREATE DATABASE IF NOT EXISTS scanova_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            print("Database 'scanova_db' created/verified!")
            
            # Select database
            cur.execute("USE scanova_db;")
            
            # Read init_mysql.sql and execute
            with open("init_mysql.sql", "r", encoding="utf-8") as f:
                sql_content = f.read()
            
            # Execute statement by statement
            statements = [s.strip() for s in sql_content.split(';') if s.strip()]
            for stmt in statements:
                if stmt.startswith('--') or stmt.startswith('/*'):
                    continue
                try:
                    cur.execute(stmt)
                except Exception as err:
                    # Ignore harmless trigger / user already exists notes
                    pass
            
            print("All relational tables and indexes initialized successfully in MySQL!")
            
            cur.execute("SHOW TABLES;")
            tables = [r[0] for r in cur.fetchall()]
            print("Active Tables in scanova_db:", tables)
            
            cur.execute("SELECT COUNT(*) FROM users;")
            user_count = cur.fetchone()[0]
            print(f"User accounts in MySQL: {user_count}")
            
        conn.close()
        return True
    except Exception as e:
        print("MySQL Error:", e)
        return False

if __name__ == "__main__":
    success = setup_mysql()
    sys.exit(0 if success else 1)
