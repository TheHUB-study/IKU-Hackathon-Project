import sqlite3 as sq3

DB_NAME = "uni_catalogue.db"

def connect_db():
    conn = sq3.connect(DB_NAME)
    cursor = conn.cursor()

    return [conn, cursor]

def save_db(conn):
    conn.commit()
    conn.close()


def init_db():
    conn, cursor = connect_db()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS unis(
            uni_id INTEGER NOT NULL PRIMARY KEY,
            name TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS courses(
            course_id INTEGER NOT NULL PRIMARY KEY,
            name TEXT,
            uni_id INTEGER,
            FOREIGN KEY (uni_id) REFERENCES unis(uni_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users(
            user_id INTEGER NOT NULL PRIMARY KEY,
            name TEXT,
            email TEXT,
            password TEXT,
            uni_id INTEGER,
            course_id INTEGER,
            FOREIGN KEY (uni_id) REFERENCES unis(uni_id)
            FOREIGN KEY (course_id) REFERENCES courses(course_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS associations(
            assoc_id INTEGER NOT NULL PRIMARY KEY,
            name TEXT,
            assoc_type TEXT,
            description TEXT,
            tag TEXT,
            course_id INTEGER,
            FOREIGN KEY (course_id) REFERENCES courses(course_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events(
            event_id INTEGER NOT NULL PRIMARY KEY,
            name TEXT,
            info TEXT,
            event_type TEXT,
            start_time TEXT,
            end_time TEXT,
            location TEXT,
            URL TEXT,
            assoc_id INTEGER,
            FOREIGN KEY (assoc_id) REFERENCES associations(assoc_id)
        )
    """)

    save_db(conn)

def unis_insert(name):
    conn, cursor = connect_db()

    cursor.execute(
        "INSERT INTO unis (name) VALUES (?)",
        (name,)
    )

    save_db(conn)


def courses_insert(name, uni):
    conn, cursor = connect_db()

    cursor.execute(
        "SELECT uni_id FROM unis WHERE name = ?",
        (uni,)
    )

    row = cursor.fetchone()

    if row is not None:
        uni_id = row[0]
    else:
        uni_id = None

    cursor.execute(
        "INSERT INTO courses (name, uni_id) VALUES (?, ?)",
        (name, uni_id)
    )

    save_db(conn)

def users_insert(name, email, password, uni, course):
    conn, cursor = connect_db()

    cursor.execute(
        "SELECT uni_id FROM unis WHERE name = ?",
        (uni,)
    )

    row = cursor.fetchone()
    
    if row is not None:
        uni_id = row[0]
    else:
        uni_id = None

    cursor.execute(
        "SELECT course_id FROM courses WHERE name = ?",
        (course,)
    )

    row = cursor.fetchone()

    if row is not None:
        course_id = row[0]
    else:
        course_id = None

    cursor.execute(
        "INSERT INTO users (name, email, password, uni_id, course_id) VALUES (?, ?, ?, ?, ?)",
        (name, email, password, uni_id, course_id)
    )

    save_db(conn)

def associations_insert(
        name, 
        assoc_type,
        description, 
        tag,
        course):
    
    conn, cursor = connect_db()

    cursor.execute(
        "SELECT course_id FROM courses WHERE name = ?",
        (course,)
    )

    row = cursor.fetchone()

    if row is not None:
        course_id = row[0]
    else:
        course_id = None

    cursor.execute(
        "INSERT INTO associations (name, assoc_type, description, tag, course_id) VALUES (?, ?, ?, ?, ?)",
        (name, assoc_type, description, tag, course_id)
    )

    save_db(conn)

def events_insert(
        name, 
        info,
        event_type, 
        start_time,
        end_time,
        location,
        URL,
        association):
    
    conn, cursor = connect_db()

    cursor.execute(
        f"SELECT assoc_id FROM associations WHERE name = ?",
        (association,)
    )

    row = cursor.fetchone()

    if row is not None:
        assoc_id = row[0]
    else:
        assoc_id = None

    cursor.execute(
        "INSERT INTO events (name, info, event_type, start_time, end_time, location, URL, assoc_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (name, info, event_type, start_time, end_time, location, URL, assoc_id)
    )

    save_db(conn)