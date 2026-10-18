import sqlite3 as sq3
import database as db

db.init_db()

events = {
        "Family feud": ["Steve Harvey style", "society", "2026-10-16T18:00:14Z", "2026-10-16T20:00:14Z", "CAGB 664", "https://www.instagram.com/p/DeUYGn8ueop/", "ACS"],
        "Worship Night": ["Time of prayer and worship", "society", "2026-10-15T18:30:14Z", "2026-10-15T21:00:14Z", "SAFB G16", "https://www.instagram.com/p/DefE2A2xlXx/", "ICGC"],
        "Lab Coursework": ["Implement a compiler", "assignment", None, "2026-10-21T00:00:14Z", None, "https://github.com/ELEC50010-IAC/Lab0-devtools", "IAC"],
        "Problem Sheet 1": ["Solve Q1-5", "assignment", None, "2026-10-18T12:00:14Z", None, "https://canvas.imperial.ac.uk/courses/9685/files/2759237?module_item_id=2347838", "LA"],
        "CPU extension": ["Add 4-bit multiplication", "assignment", None, "2026-10-15T13:00:14Z", None, "https://github.com/edstott/EEE1labs/tree/main/DECA/Spring/Lab2-2025/eep1lab2", "DECA"],
        "Discrete Maths 1": ["Prof Steffan Van Bakel", "lecture", "2026-10-20T09:00:14Z", "2026-10-20T10:00:14Z", "Huxley 308", "https://imperial.cloud.panopto.eu/Panopto/Pages/Viewer.aspx?id=1c246267-81ce-4316-b0c2-b4ba00af5686", "DM"],
        "Signals & Systems": ["Prof Stefan Vlaski", "lecture", "2026-10-14T14:00:14Z", "2026-10-14T15:00:14Z", "EE 408", "https://imperial.cloud.panopto.eu/Panopto/Pages/Viewer.aspx?id=21ab9b91-18f7-45d6-9ace-b4b40119db0f", "IAC"],
        }

associations = {
        "IAC": ["Instruction Architecture and Compilers", "505", "EIE-02"], 
        "DECA": ["Digital Electronics and Computer Architecture", "50%", "EIE-02"],
        "DM": ["Discrete Maths", "75%", "Computing-01"],
        "LA": ["Linear Algebra", "25%", "Computing-01"],
        "ACS": ["Afro Carribean Society", "@imperial_acs", None],
        "ICGC": ["Imperial College Gospel Choir", "@icgospel", None],
        }

courses = {"EIE-2": ["IAC", "DECA"], "Computing-1": ["DM", "LA"]}

for course in courses:
    db.courses_insert(course)

for association in associations:
    description = associations[association][0]
    tag = associations[association][1]
    course = associations[association][2]
    db.associations_insert(association, description, tag, course)

for event in events:
    info = events[event][0]
    event_type = events[event][1]
    start_time = events[event][2]
    end_time = events[event][3]
    location = events[event][4]
    link = events[event][5]
    association = events[event][6]
    db.events_insert(event, info, event_type, start_time, end_time, location, link, association)