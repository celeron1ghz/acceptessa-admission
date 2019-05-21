import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
const aws = require('aws-sdk');

function transformV2H(records: any[]) : object {
  const result: { [s: string]: Object } = { };

  for (const record of records) {
    if(result[record.id] == null) {
      result[record.id] = { id: record.id };
    }

    result[record.id][record.data_key] = record.data_value;
  }

  return result;
}

const commands = {
  'circle.list': async (dynamodb,param) => {
    const ret = await dynamodb.query({
      TableName: 'tessa_master_data',
      IndexName: 'tessa_master_by_exhibition',
      KeyConditionExpression: "parent = :parent",
      ExpressionAttributeValues: { ":parent": param.exhibition_id },
    }).promise();

    const ret2 = await dynamodb.query({
      TableName: 'tessa_master_data',
      IndexName: 'tessa_master_by_exhibition',
      KeyConditionExpression: "parent = :parent and id = :id",
      ExpressionAttributeValues: { ":parent": "exhibition", ":id": param.exhibition_id },
    }).promise();

    const result = transformV2H(ret.Items);
    const result2 = transformV2H(ret2.Items);

    return {
      exhibition: result2[param.exhibition_id],
      circles: Object.values(result),
    }
  },

  'exhibition.list': async (dynamodb,param) => {
    const ret = await dynamodb.query({
      TableName: 'tessa_master_data',
      IndexName: 'tessa_master_by_exhibition',
      KeyConditionExpression: "parent = :parent",
      ExpressionAttributeValues: { ":parent": "exhibition" },
    }).promise();

    const result = transformV2H(ret.Items);
    return Object.values(result);
  },

  'circle.samplebook': async (dynamodb,param) => {
    return dynamodb.put({
      TableName: 'tessa_master_data',
      Item: {
        id: param.circle_id,
        parent: param.exhibition_id,
        data_key: 'samplebook',
        data_value: 'OK',
      },
      ConditionExpression: "attribute_not_exists(id) and attribute_not_exists(data_key)",
    }).promise()
    .catch(error => {
      console.log("Error happen: " + error);
      return { error };
    });
  },

/*
  'circle.admission': async (dynamodb,param) => {
    const ret = await dynamodb.get({
      TableName: 'tessa_master_data',
      IndexName: 'tessa_master_by_datavalue',
      KeyConditionExpression: "id = :id and data_key = :key",
      ExpressionAttributeValues: { ":id": param.serial, ":key": "admission_code" },
    }).promise();

    console.log(1111);
    console.log(ret);
    return {};

    return dynamodb.put({
      TableName: 'tessa_master_data',
      Item: {
        id: param.circle_id,
        parent: param.exhibition_id,
        data_key: 'samplebook',
        data_value: 'OK',
      },
      ConditionExpression: "attribute_not_exists(id) and attribute_not_exists(data_key)",
    }).promise()
    .catch(error => {
      console.log("Error happen: " + error);
      return { error };
    });
*/
  },


};

export const main: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const dynamodb = new aws.DynamoDB.DocumentClient(
      event.isOffline
        ? { region: "localhost", endpoint: "http://localhost:8000" }
        : {}
    );

    const body = JSON.parse(event.body);
    const ret = await commands[body.command](dynamodb,body);
    return {
      statusCode: 200,
      body: JSON.stringify(ret),
    };

  } catch (e) {
    console.log("Error happen:", e);
    return {
      statusCode: 500,
      body: "Error: " + e,
    };
  }
}
