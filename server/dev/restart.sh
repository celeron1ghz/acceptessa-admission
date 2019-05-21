#!/bin/zsh
cd `dirname $0`
RESULT=$(ps aux | grep "[D]ynamoDBLocal_lib" | awk "{ print \$2 }")

echo "Found process:" $(echo $RESULT | wc -l)
echo $RESULT
echo $RESULT | xargs kill

cd ..
node dev/generate.js
sls dynamodb start
