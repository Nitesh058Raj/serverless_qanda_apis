'use strict';

//AWS dynamodb connection
const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

//Get Api
module.exports.getquestion = (event, context, callback) => {

  //defining paramaters
  const params = {
    TableName: process.env.QUESTION_TABLE,
    Key: {
      Qid: event.pathParameters.Qid,
    },
  };

  // fetch Data
  dynamoDb.get(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {
          "Content-Type": "*",
          "Access-Control-Allow-Methods": "*",
          "Access-Control-Allow-Origin": "*",
        },
        body: "Get Problem",
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
    callback(null, response);
  });
}

//Create Api
module.exports.createquestion = (event, context, callback) => {
  
  //collecting data from event
  const data = JSON.parse(event.body);
  
  //content to put into dynomodb
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const params = {
    TableName: process.env.QUESTION_TABLE,
    Item: {
      Qid: AWS.util.uuid.v4(),
      Quser: data.Quser,
      Qtitle: data.Question,
      Qdetails: data.Qdetail,
      checked: false,
      createdAt: timestamp,
    },
  };

  dynamoDb.put(params, (error) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {
          "Content-Type": "*",
          "Access-Control-Allow-Methods": "*",
          "Access-Control-Allow-Origin": "*",
        },
        body: "Problem...(2): dynamo put problem",
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(params.Item),
    };
    callback(null, response);
  });
}

//Scan Api
module.exports.allquestions = (event, context, callback) => {
  
  //define parameters
  const params = {
    TableName: process.env.QUESTION_TABLE,
  };

  dynamoDb.scan(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {
          "Content-Type": "*",
          "Access-Control-Allow-Methods": "*",
          "Access-Control-Allow-Origin": "*",
        },
        body: "Scan Problem",
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(result),
    };
    callback(null, response);
  });
}

//Answer Api
module.exports.answerquestion = (event, context, callback) => {

  //collecting data
  const data = JSON.parse(event.body);
  
  //defining params
  const params = {
    TableName: process.env.QUESTION_TABLE,
    Item: {
      Qid: event.pathParameters.Qid,
      Quser: data.Quser,
      Qtitle: data.Qtitle,
      Qdetails: data.Qdetails,
      createdAt: data.createdAt,
      Answer: data.Answer,
      Ansuser: data.Ansuser,
      checked: true,
    },
  };

  // Here put will overwrite item in table 
  // simply put this new item in place of the old item with same Qid 
  dynamoDb.put(params, (error) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: {
          "Content-Type": "*",
          "Access-Control-Allow-Methods": "*",
          "Access-Control-Allow-Origin": "*",
        },
        body: "Problem...(2): dynamo put problem",
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(params.Item),
    };
    callback(null, response);
  });

}
