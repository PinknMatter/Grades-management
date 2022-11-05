-- Up

CREATE TABLE Messages(
    id INTEGER PRIMARY KEY,
    text STRING
);

CREATE TABLE Users(
    u_id INTEGER PRIMARY KEY,
    username STRING,
    password STRING,
    priv STRING DEFAULT 'student'
);


CREATE TABLE Courses(
    c_id INTEGER PRIMARY KEY,
    name STRING,
    code STRING
);

CREATE TABLE Grades(
    u_id INTEGER,
    c_id INTEGER,
    teacherName String,
    grade1 INTEGER,
    grade2 INTEGER,
    grade3 INTEGER,
    FOREIGN KEY (u_id) REFERENCES Users(u_id),
    FOREIGN KEY (c_id) REFERENCES Courses(c_id)
);

-- Down

DROP TABLE Messages;
DROP TABLE Users;
DROP TABLE Courses;
DROP TABLE Grades;