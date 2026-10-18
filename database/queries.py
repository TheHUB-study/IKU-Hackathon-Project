import sqlite3 as sq3
import database as db

def verify_login(email, pwd):
    conn, cursor = db.connect_db()

    cursor.execute(
        "SELECT password FROM users WHERE email = ?",
        (email,)
        )

    row = cursor.fetchone()#

    if row is not None:
        password = row[3]
    else:
        db.save_db(conn)
        return 0

    if pwd == password:
        db.save_db(conn)
        return 1


def get_uni(user_email):
    conn, cursor = db.connect_db()

    cursor.execute(
        "SELECT uni_id FROM users WHERE email = ?",
        (user_email,)
    )

    row = cursor.fetchone()

    if row is not None:
        uni_id = row[-2]
    else:
        db.save_db(conn)
        return ""

    cursor.execute(
        "SELECT name FROM unis WHERE uni_id = ?",
        (uni_id,)
    )

    row = cursor.fetchone()
    db.save_db(conn)
    return row[1]


def get_course(user_email):
    conn, cursor = db.connect_db()

    cursor.execute(
        "SELECT course_id FROM users WHERE email = ?",
        (user_email,)
    )

    row = cursor.fetchone()

    if row is not None:
        course_id = row[-1]
    else:
        db.save_db(conn)
        return ""

    cursor.execute(
        "SELECT name FROM courses WHERE course_id = ?",
        (course_id,)
    )

    row = cursor.fetchone()
    db.save_db(conn)
    return row[1]


def get_module_info(course):
    conn, cursor = db.connect_db()

    cursor.execute(
        "SELECT course_id FROM courses WHERE name = ?",
        (course,)
    )

    row = cursor.fetchone()

    if row is not None:
        course_id = row[0]
    else:
        db.save_db(conn)
        return ""

    cursor.execute(
        "SELECT * FROM associations WHERE course_id = ?",
        (course_id,)
    )

    rows = cursor.fetchall()
    db.save_db(conn)
    return row


def get_lecture_info(module):
    conn, cursor = db.connect_db()

    cursor.execute(
        "SELECT assoc_id FROM associations WHERE name = ?",
        (module,)
    )

    row = cursor.fetchone()

    if row is not None:
        module_id = row[0]
    else:
        db.save_db(conn)
        return ""

    cursor.execute(
        "SELECT * FROM events WHERE event_type = ? AND assoc_id = ?",
        ("lecture", module_id)
    )

    rows = cursor.fetchall()
    db.save_db(conn)
    return row


def get_assignment_info(module):
    conn, cursor = db.connect_db()

    cursor.execute(
        "SELECT assoc_id FROM associations WHERE name = ?",
        (module,)
    )

    row = cursor.fetchone()

    if row is not None:
        module_id = row[0]
    else:
        db.save_db(conn)
        return ""

    cursor.execute(
        "SELECT * FROM events WHERE event_type = ? AND assoc_id = ?",
        ("assignment", module_id)
    )

    rows = cursor.fetchall()
    db.save_db(conn)
    return row


def get_soc_events_info(society):
    conn, cursor = db.connect_db()

    cursor.execute(
        "SELECT assoc_id FROM associations WHERE name = ?",
        (society,)
    )

    row = cursor.fetchone()

    if row is not None:
        society_id = row[0]
    else:
        db.save_db(conn)
        return ""

    cursor.execute(
        "SELECT * FROM events WHERE assoc_id = ?",
        (society_id,)
    )

    rows = cursor.fetchall()
    db.save_db(conn)
    return row