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

  singleById(id) {
    const param = {
      TableName: 'tessa_master_data',
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: { ":id": id },
      ReturnConsumedCapacity: 'INDEXES',
    };

    return this.dynamodb.query(param).promise().then(data => {
      this.printConsumedCapacityUnits(data);
      const result = transformV2H(data.Items);
      return Object.values(result)[0];
    });
  }

  listByParent(parentVal) {
    const param = {
      TableName: 'tessa_master_data',
      IndexName: "tessa_master_by_exhibition",
      KeyConditionExpression: "parent = :parent",
      ExpressionAttributeValues: { ":parent": parentVal },
      ReturnConsumedCapacity: 'INDEXES',
    };

    return this.dynamodb.query(param).promise().then(data => {
      this.printConsumedCapacityUnits(data);
      const result = transformV2H(data.Items);
      return Object.values(result);
    });
  }

  single_by_key(condVal) {
    const param = {
      TableName: 'tessa_master_data',
      IndexName: "tessa_master_by_datakey",
      KeyConditionExpression: "data_key = :key and data_value = :value",
      ExpressionAttributeValues: condVal,
      ReturnConsumedCapacity: 'INDEXES',
    };

    return this.dynamodb.query(param).promise().then(data => {
      this.printConsumedCapacityUnits(data);

      if (data.Items.length == 0)  { return null; }
      if (data.Items.length > 1)   { throw new Error("おかしい"); }
      return data.Items[0];
    });
  }

  printConsumedCapacityUnits(ret: any) {
    const c = ret.ConsumedCapacity;
    if (c == null) { return; }
    console.log(`ConsumedCapacityUnits: ${c.TableName}(Table) = ${c.CapacityUnits}`);

    if (c.GlobalSecondaryIndexes != null)   {
      for (const table of Object.keys(c.GlobalSecondaryIndexes))  {
        console.log(`ConsumedCapacityUnits: ${table}(GSI) = ${c.GlobalSecondaryIndexes[table].CapacityUnits}`);
      }
    }
  }

  async command_exhibition_list(param)    {
    return this.listByParent("exhibition");
  }

  async command_circle_list(param)    {
    const circles = await this.listByParent(param.exhibition_id);
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
    const circle = await this.singleById(id);
    const max = parseInt(circle.admission_count);

    try {
      // create empty data first
      await this.dynamodb.put({
        TableName: 'tessa_log_data',
        Item: { id: code.id, data_key: 'admission', data_value: [] },
        ConditionExpression:  "attribute_not_exists(id) and attribute_not_exists(data_key)"
      }).promise()
    } catch (e) {
      if (e.code !== "ConditionalCheckFailedException") {
        throw e
      }
    }

    try {
      const ret = await this.dynamodb.update({
        TableName: 'tessa_log_data',
        Key: { id: code.id, data_key: 'admission' },
        UpdateExpression: "SET data_value = list_append(:data, data_value)",
        ConditionExpression:  "size(data_value) < :max",
        ExpressionAttributeValues: { ":max": max, ":data": [{ at: new Date().getTime() }] },
        ReturnValues: "UPDATED_NEW",
      }).promise()

      const used = ret.Attributes.data_value.length;
      return { status: "accepted", max, used, circle };
    } catch (e) {
      if (e.code !== "ConditionalCheckFailedException") {
        throw e
      }

      return { status: "limit_exceed", max, circle };
    }
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
