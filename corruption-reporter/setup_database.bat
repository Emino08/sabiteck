@echo off
echo Setting up Corruption Reporter Database...

echo Creating database...
mysql -h localhost -P 4306 -u root -p1212 --default-auth=mysql_native_password -e "CREATE DATABASE IF NOT EXISTS corruption_reporter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo Running migrations...
mysql -h localhost -P 4306 -u root -p1212 --default-auth=mysql_native_password corruption_reporter < database/migrations/001_create_initial_schema.sql

echo Running seeds...
mysql -h localhost -P 4306 -u root -p1212 --default-auth=mysql_native_password corruption_reporter < database/seeds/002_initial_data.sql

echo Database setup complete!
pause
