'use strict';
const AWS = require('aws-sdk')
const {v4} = require('uuid')

const dynamodb = new AWS.DynamoDB.DocumentClient();

const createProduct = async (event) => {
  const reqBody = JSON.parse(event.body)
  const productBody = {
    id: v4(),
    title: reqBody.title,
    description: reqBody.description,
    price: reqBody.price
  }
  await dynamodb.put({
    TableName: "products",
    Item: productBody
  }).promise()
  return {
    statusCode: 201,
    body: JSON.stringify(productBody)
  }
}

const getProductsList = async (event) => {
  const products = await dynamodb.scan({ TableName: 'products' }).promise()
  const stocks = await dynamodb.scan({ TableName: 'stocks' }).promise()

  let stocksHash = {}

  for (let i = 0; i < stocks.Items.length - 1; i++) {
    stocksHash[stocks.Items[i].product_id] = stocks.Items[i]
  }

  const result = products.Items.map(p => {
    if (p.id in stocksHash) {
      p.count = stocksHash[p.id].count
    } else {
      p.count = 0
    }

    return p
  })


  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(result),
  };
};

const getProductsById = async (event) => {
  const productId = event.pathParameters.productId
  const product = await dynamodb.get({TableName: "products", Key: {id: productId}}).promise()
  if (!product.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({message: "product not available"})
    }
  }

  const stock = await dynamodb.get({ TableName: "stocks", Key: { product_id: productId } }).promise()
  let count = 0

  if (stock.Item) count = stock.Item.count
  
  return {
    statusCode: 200,
    body: JSON.stringify({...product.Item, count}),
  };
};

module.exports = {
  getProductsList, getProductsById, createProduct
}