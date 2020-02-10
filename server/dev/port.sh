#!/bin/bash
function show_pid() {
    label=$1
    pattern=$2

    while :
    do
        PS_RESULT=$(ps aux | grep "$pattern" |  awk '{ print $2 }')
        LINES=$(echo "$PS_RESULT" | wc -l | awk '{ print $1 }')

        if [ "$PS_RESULT" != "" ]; then
            break;
        fi

        echo "process count ($LINES) != 1 on ($pattern). repeat..."
        sleep 3
    done

    PORT=$(lsof -n -P -p $PS_RESULT | grep LISTEN | awk '{ print $9 }')
    echo "$PORT -- $label"
}

show_pid "react-scripts start" "[a]cceptessa-admission/client/node_modules/react-scripts/scripts/start.js"
show_pid "sls dynamodb start"  "[D]ynamoDBLocal.jar"
show_pid "sls offline"         "[s]erverless offline"
