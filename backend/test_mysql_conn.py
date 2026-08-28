import pymysql

passwords_to_try = ['', 'root', 'admin', '1234', '123456', '12345678', 'password', 'ScanovaSecure2026!', 'root123', 'admin123', 'mysql', 'Admin@123', 'Root@123']
success = False
for pwd in passwords_to_try:
    try:
        conn = pymysql.connect(host='127.0.0.1', user='root', password=pwd, port=3306, connect_timeout=2)
        print(f"SUCCESS_PASSWORD: {pwd}")
        with conn.cursor() as cur:
            cur.execute("SHOW DATABASES;")
            dbs = [row[0] for row in cur.fetchall()]
            print("DATABASES:", dbs)
        conn.close()
        success = True
        break
    except Exception as e:
        pass

if not success:
    print("NEEDS_PASSWORD")
