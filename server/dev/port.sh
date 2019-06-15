#!/bin/bash
echo "IP address"
echo "----------"
ip -4 addr
echo "----------"

SERVERLESS_PROCESS=$(ps aux | grep '[s]erverless offline' | awk '{ print $2 }')
SERVERLESS_PORT=$(lsof -n -P -p $SERVERLESS_PROCESS | grep LISTEN | awk '{ print $9 }')
echo "[sls offline]         $SERVERLESS_PORT"

CLIENT_PROCESS=$(ps aux | grep '[a]cceptessa-admission/client/node_modules/react-scripts/scripts/start.js' | awk '{ print $2 }')
CLIENT_PORT=$(lsof -n -P -p $CLIENT_PROCESS | grep LISTEN | awk '{ print $9 }')
echo "[react-scripts start] $CLIENT_PORT"

SERVER_PROCESS=$(ps aux | grep '[D]ynamoDBLocal.jar' | awk '{ print $2 }')
SERVER_PORT=$(lsof -n -P -p $SERVER_PROCESS | grep LISTEN | awk '{ print $9 }')
echo "[sls dynamodb start]  $SERVER_PORT"
