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


class AdmissionClient {
  constructor(dynamodb){
    this.dynamodb = dynamodb;
  }

  dispatch(param) {
    const command = "command_" + param.command.replace('.', '_');
    console.log("command: " + command);

    if (this[command] == null)   {
      throw new Error("no command");
    }

    return this[command](param);
  }

  query_by_parent(condVal) {
    const param = {
      TableName: 'tessa_master_data',
      IndexName: "tessa_master_by_exhibition",
      KeyConditionExpression: "parent = :parent",
      ExpressionAttributeValues: condVal,
      ReturnConsumedCapacity: 'INDEXES',
    };

    return this.dynamodb.query(param)
      .promise()
      .then(data => {
        this.printConsumedCapacityUnits(data);
        const result = transformV2H(data.Items);
        return Object.values(result);
      })
  }

  single_by_key(condVal) {
    const param = {
      TableName: 'tessa_master_data',
      IndexName: "tessa_master_by_datakey",
      KeyConditionExpression: "data_key = :key and data_value = :value",
      ExpressionAttributeValues: condVal,
      ReturnConsumedCapacity: 'INDEXES',
    };

    return this.dynamodb.query(param)
      .promise()
      .then(data => {
        this.printConsumedCapacityUnits(data);

        if (data.Items.length == 0)  { return null; }
        if (data.Items.length > 1)   { throw new Error("おかしい"); }
        return data.Items[0];
      })
  }

  printConsumedCapacityUnits(ret: any) {
    const c = ret.ConsumedCapacity;
    if (c == null) { return; }
    console.log(`ConsumedCapacityUnits: ${c.TableName}(Table) = ${c.CapacityUnits}`);

    for (const table of Object.keys(c.GlobalSecondaryIndexes))  {
      console.log(`ConsumedCapacityUnits: ${table}(GSI) = ${c.GlobalSecondaryIndexes[table].CapacityUnits}`);
    }
  }

  async command_exhibition_list(param)    {
    return this.query_by_parent({ ":parent": "exhibition" });
  }

  async command_circle_list(param)    {
    const circles = await this.query_by_parent({ ":parent": param.exhibition_id });
    return {
      circles: Object.values(circles),
    }
  }

  async command_circle_samplebook(param)    {
    return this.dynamodb.put({
      TableName: 'tessa_master_data',
      Item: {
        id: param.circle_id,
        parent: param.exhibition_id,
        data_key: 'samplebook',
        data_value: 'OK',
      },
      ConditionExpression: "attribute_not_exists(id) and attribute_not_exists(data_key)",
      ReturnConsumedCapacity: 'INDEXES',
    }).promise()
  }

  async command_circle_admission(param)    {
    const code = await this.single_by_key({ ":key": "admission_code", ":value": param.serial });
    const id = code.id;
    console.log(id);

    const ret2 = await this.dynamodb.get({
      TableName: 'tessa_master_data',
      Key: { id, "data_key": "admission_count" },
      ReturnConsumedCapacity: 'INDEXES',
    }).promise().then(data => data.Item);

    const max = ret2.data_value;
console.log(ret2)

    return {};
  }
}

export const main: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const dynamodb = new aws.DynamoDB.DocumentClient(
      event.isOffline
        ? { region: "localhost", endpoint: "http://localhost:8000" }
        : {}
    );

    const client = new AdmissionClient(dynamodb);
    const body = JSON.parse(event.body);
    const ret = await client.dispatch(body);

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
