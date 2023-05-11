@ECHO OFF
docker-compose  down -v

docker-compose build

docker-compose up mongo -d
timeout /t 4 >nul
docker-compose up api -d
timeout /t 4 >nul
docker-compose up client