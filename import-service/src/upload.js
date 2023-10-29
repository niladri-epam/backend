'use strict';
const AWS = require('aws-sdk')
const csv = require('csv-parser');

const importFileParser = async (event) => {
    const S3 = new AWS.S3();
    const record = event.Records[0]; 

    if (!record) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No File Found' }),
      };
    }
  
    const { s3 } = record;
    const bucket = s3.bucket.name;
    const key = s3.object.key;
  
    const params = {
      Bucket: bucket,
      Key: key,
    };
  
    console.log('params: ', params)
    const s3Stream = S3.getObject(params).createReadStream();
    s3Stream
      .pipe(csv())
      .on('data', (data) => {
        console.log(data);
      })
      .on('end', () => {
        console.log('Done Reading File');
      });
  
    return {
      statusCode: 200,
      body: JSON.stringify({ records: records }),
    };
};


const importProductsFile = async (event) => {
    const S3 = new AWS.S3();
    const { queryStringParameters } = event;
  
    if ((!'name' in queryStringParameters)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'name query param is required' }),
        };
    }
    
    const url = await S3.getSignedUrl('putObject', {
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
}

module.exports = {
  importProductsFile, importFileParser
}