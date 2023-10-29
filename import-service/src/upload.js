'use strict';
const AWS = require('aws-sdk')
const csv = require('csv-parser');
const s3 = new AWS.S3();
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

    return new Promise((resolve, reject) => {
      s3Stream
        .pipe(csv())
        .on('data', (data) => {
          console.log("csv data: ");
          console.log(data);
        })
        .on('end', () => {
          console.log('Done Reading File');
          console.log(JSON.stringify(csvData));
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