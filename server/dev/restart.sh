#!/bin/zsh
THISDIR=`dirname $0`

cd $THISDIR
RESULT=$(ps aux | grep "[D]ynamoDBLocal_lib" | awk "{ print \$2 }")

echo "Found process:" $(echo $RESULT | wc -l)
echo $RESULT
echo $RESULT | xargs kill

cd ..
node dev/generate.js
sls dynamodb start

cd $THISDIR
rm -f  *.png
cat circle.json \
  | jq -r '[.[] | select(.data_key=="admission_code") | .] | .[0:30] | .[] | .data_value' \
  | xargs -P 8 -I {}  ../node_modules/qrcode/bin/qrcode  -o {}.png {}
