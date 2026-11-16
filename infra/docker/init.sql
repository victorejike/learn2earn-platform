-- Create gitea database for the internal git server
CREATE DATABASE gitea OWNER talent_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE gitea TO talent_user;
GRANT ALL PRIVILEGES ON DATABASE 1talent TO talent_user;
