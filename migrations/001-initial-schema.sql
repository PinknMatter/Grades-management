-- Up

CREATE TABLE Messages(
    id INTEGER PRIMARY KEY,
    text STRING
);

CREATE TABLE Users(
    u_id INTEGER PRIMARY KEY,
    username STRING,
    password STRING
);
-- Down

DROP TABLE Messages;
DROP TABLE Users;