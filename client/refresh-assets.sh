#!/bin/sh
CONF=`aws cloudformation describe-stacks --stack-name acceptessa-admission2-dev`
BUCKET=`echo $CONF | jq -r '.Stacks[0].Outputs[] | select(.OutputKey == "AssetBucket") | .OutputValue'`
DIST=`echo $CONF | jq -r '.Stacks[0].Outputs[] | select(.OutputKey == "DistributionId") | .OutputValue'`
NOW=`date +%s`

echo building...
cd `dirname $0`
yarn build

echo sync to $BUCKET...
cd build
aws s3 sync --delete . s3://$BUCKET

echo invalidation...
aws cloudfront create-invalidation --distribution-id $DIST --invalidation-batch "Paths={Quantity=1,Items=[/*]},CallerReference=$NOW"