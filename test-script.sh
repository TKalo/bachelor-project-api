#!/bin/bash

docker-compose -f docker-compose-integration.yaml down -v

docker-compose -f docker-compose-integration.yaml build

docker-compose -f docker-compose-integration.yaml up mongo -d
sleep 4

docker-compose -f docker-compose-integration.yaml up api -d
sleep 4

docker-compose -f docker-compose-integration.yaml up client