'use strict';
const AWS = require('aws-sdk')

const dynamodb = new AWS.DynamoDB.DocumentClient();

const updateStock = async (event) => {
  const reqBody = JSON.parse(event.body)
  
  const product = await dynamodb.get({TableName: "products", Key: {id: reqBody.id}}).promise()
  if (!product.Item) {
    return {
      statusCode: 404,
      body: 'Product not found'
    }
  }
    await dynamodb.put({
        TableName: "stocks",
        Item: {
            product_id: product.Item.id,
            count: reqBody.count
        }
        }).promise()
    
  return {
    statusCode: 201,
    body: 'created'
  }
}

module.exports = {
  updateStock
}