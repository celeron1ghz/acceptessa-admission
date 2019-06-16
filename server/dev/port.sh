#!/bin/bash
function show_pid() {
    label=$1
    pattern=$2

    while :
    do
        RESULT=$(ps aux | grep "$pattern" | awk '{ print $2 }')
        LINES=$(echo "$RESULT" | wc -l | xargs)

        if [ "$LINES" -eq "1" ]; then
            break;
        fi

        echo "process count ($LINES) != 1 on ($pattern). repeat..."
        sleep 3
    done

    PORT=$(lsof -n -P -p $RESULT | grep LISTEN | awk '{ print $9 }')
    echo "$PORT -- $label"
}

show_pid "sls offline"         "[s]erverless offline"
show_pid "react-scripts start" "[a]cceptessa-admission/client/node_modules/react-scripts/scripts/start.js"
show_pid "sls dynamodb start"  "[D]ynamoDBLocal.jar"
