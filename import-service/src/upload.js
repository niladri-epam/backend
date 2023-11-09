'use strict';
const AWS = require('aws-sdk')
const csv = require('csv-parser');
const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const {v4} = require('uuid')
const importFileParser = async (event) => {
  try {
    const record = event.Records[0];
    if (!record) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No File Found' }),
      };
    }

    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    const s3Stream = s3.getObject({
      Bucket: bucket,
      Key: key,
    }).createReadStream();

    const processedData = []

    await new Promise((resolve, reject) => {
      s3Stream
        .pipe(csv())
        .on('data', async (data) => {
          if (Object.keys(data).length === 3 && data['_1'] !== 'title') {
            let obj = {}
            for (let key in data) {
              if (key === '_1') {
                obj['description'] = data[key]
              } else if (key === '_2') {
                obj['price'] = data[key]
              } else {
                obj['title'] = data[key]
              }
            }
            processedData.push(obj)
          }
          
        })
        .on('end', () => {
          resolve({
            statusCode: 200,
            body: JSON.stringify({message: 'success'}),
          });
        })
        .on('error', (error) => {
          console.error('error: ', error);
          reject({
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
          });
        });
    });
    if (processedData.length > 6) {
      console.log(`Products should not be more than 5 records`);
      return
    }

    for (let i = 0; i < processedData.length; i++) {
      const result = await sqs.sendMessage({
        QueueUrl: 'https://sqs.ap-south-1.amazonaws.com/749453116506/catalogItemsQueue',
        MessageBody: JSON.stringify({ message: {...processedData[i], id: v4()} })
      }, (err, data) => {
        if (err) {
          console.log(`sendMessage Error ${err.toString()}`)
        }
      }).promise();
    }
  } catch (error) {
    console.error('error: ', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

const importProductsFile = async (event) => {
  try {
    const { queryStringParameters } = event;
    
    if (!queryStringParameters) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'name query is required' }),
      };
    }

      if ((!'name' in queryStringParameters)) {
          return {
            statusCode: 500,
            body: JSON.stringify({ error: 'name is required' }),
          };
      }
      
      const url = await s3.getSignedUrl('putObject', {
          Bucket: 'epam-uploaded',
          Key: `uploaded/${queryStringParameters.name}`,
          Expires: 300, 
          ContentType: 'application/csv',
      });

      return {
          statusCode: 200,
          headers: {
              "Access-Control-Allow-Origin": "*",
            },
        body: JSON.stringify({ url }),
      };
    } catch (error) {
      console.error('error: ', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      };
    }
}

module.exports = {
  importProductsFile, importFileParser
}