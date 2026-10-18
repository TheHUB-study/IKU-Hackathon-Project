import hmac

import database as db


def _fetch_one(query, parameters=()):
    conn, cursor = db.connect_db()
    try:
        cursor.execute(query, parameters)
        row = cursor.fetchone()
        if row is None:
            return None
        return dict(zip((column[0] for column in cursor.description), row))
    finally:
        conn.close()


def _fetch_all(query, parameters=()):
    conn, cursor = db.connect_db()
    try:
        cursor.execute(query, parameters)
        columns = [column[0] for column in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    finally:
        conn.close()


def verify_login(email, password):
    conn, cursor = db.connect_db()
    try:
        cursor.execute(
            "SELECT user_id, password FROM users WHERE email = ? COLLATE NOCASE ORDER BY user_id LIMIT 1",
            (email.strip(),),
        )
        row = cursor.fetchone()
        if row is None:
            return False

        user_id, stored_password = row
        if not isinstance(stored_password, str):
            return False
        if db.verify_password(password, stored_password):
            return True

        # Upgrade accounts seeded before password hashing was introduced.
        if not stored_password.startswith("pbkdf2_sha256$") and hmac.compare_digest(
            password.encode("utf-8"), stored_password.encode("utf-8")
        ):
            cursor.execute(
                "UPDATE users SET password = ? WHERE user_id = ?",
                (db.hash_password(password), user_id),
            )
            conn.commit()
            return True
        return False
    finally:
        conn.close()


def get_uni(user_email):
    row = _fetch_one(
        """SELECT unis.name
        FROM users
        LEFT JOIN unis ON users.uni_id = unis.uni_id
        WHERE users.email = ? COLLATE NOCASE""",
        (user_email.strip(),),
    )
    return row["name"] if row is not None else None


def get_course(user_email):
    row = _fetch_one(
        """SELECT courses.name
        FROM users
        LEFT JOIN courses ON users.course_id = courses.course_id
        WHERE users.email = ? COLLATE NOCASE""",
        (user_email.strip(),),
    )
    return row["name"] if row is not None else None


def get_module_info(course):
    return _fetch_all(
        """SELECT assoc_id, name, description, tag
        FROM associations
        WHERE course_id = (
            SELECT course_id FROM courses WHERE name = ?
        ) AND assoc_type = 'module'
        ORDER BY name""",
        (course,),
    )


def _get_association_events(association, event_type=None):
    query = """SELECT
            events.event_id,
            events.name,
            events.info,
            events.event_type,
            events.start_time,
            events.end_time,
            events.location,
            events.URL AS url,
            associations.name AS association,
            associations.assoc_type AS association_type
        FROM events
        JOIN associations ON events.assoc_id = associations.assoc_id
        WHERE associations.name = ?"""
    parameters = [association]
    if event_type is not None:
        query += " AND events.event_type = ?"
        parameters.append(event_type)
    query += " ORDER BY COALESCE(events.start_time, events.end_time), events.name"
    return _fetch_all(query, parameters)


def get_lecture_info(module):
    return _get_association_events(module, "lecture")


def get_assignment_info(module):
    return _get_association_events(module, "assignment")


def get_soc_events_info(society):
    return _get_association_events(society, "society")


def get_user_dashboard(user_email):
    user = _fetch_one(
        """SELECT users.name, users.email, unis.name AS university, courses.name AS course
        FROM users
        LEFT JOIN unis ON users.uni_id = unis.uni_id
        LEFT JOIN courses ON users.course_id = courses.course_id
        WHERE users.email = ? COLLATE NOCASE""",
        (user_email.strip(),),
    )
    if user is None:
        return None

    modules = get_module_info(user["course"]) if user["course"] else []
    events = []
    for module in modules:
        module["weighting"] = module.pop("tag")
        module["lectures"] = get_lecture_info(module["name"])
        module["assignments"] = get_assignment_info(module["name"])
        events.extend(module["lectures"])
        events.extend(module["assignments"])

    society_rows = _fetch_all(
        "SELECT name FROM associations WHERE assoc_type = 'society' ORDER BY name"
    )
    societies = []
    for society in society_rows:
        society_events = get_soc_events_info(society["name"])
        societies.append({"name": society["name"], "events": society_events})
        events.extend(society_events)

    events.sort(key=lambda event: (event["start_time"] or event["end_time"] or "", event["name"]))
    return {
        "user": user,
        "modules": modules,
        "societies": societies,
        "events": events,
    }
