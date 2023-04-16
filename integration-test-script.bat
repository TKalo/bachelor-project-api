@ECHO OFF
docker-compose -f docker-compose-integration.yaml down -v

docker-compose -f docker-compose-integration.yaml build

docker-compose -f docker-compose-integration.yaml up mongo -d
timeout /t 4 >nul
docker-compose -f docker-compose-integration.yaml up api -d
timeout /t 4 >nul
docker-compose -f docker-compose-integration.yaml up client