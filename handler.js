"use strict";

//AWS dynamodb and ses connection
const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient(); 
const ses = new AWS.SES(); // Simple Email Service

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
};

//Create Api
module.exports.createquestion = (event, context, callback) => {
  //collecting data from event
  const data = JSON.parse(event.body);
  
  //content to put into dynomodb
  //Timestamp for +5:30 time
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });
  //Uuid --> Uniq User Id <-- for both table
  const qid = AWS.util.uuid.v4();
  const params = {
    TableName: process.env.QUESTION_TABLE,
    Item: {
      Qid: qid,
      Quser: data.Quser,
      Qtitle: data.Question,
      Qdetails: data.Qdetail,
      checked: false,
      createdAt: timestamp,
    },
  };

  const param_mail = {
    TableName: process.env.MAIL_TABLE,
    Item: {
      Qid: qid,
      Quser: data.Quser,
      Mail: data.mail,
    },
  };
  // Putting value at User table --> Mail Table
  dynamoDb.put(param_mail, (error) => {
    if (error) {
      console.log(error);
    }
  });

  //Putting data into Data Table
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
};

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
};

//Answer Api
module.exports.answerquestion = (event, context, callback) => {
  //collecting data
  const data = JSON.parse(event.body);

  const param_mail = {
    TableName: process.env.MAIL_TABLE,
    Key: {
      Qid: event.pathParameters.Qid,
    },
  };

  // Getting data from Mail-Table for SES => For sending mail
  dynamoDb.get(param_mail, (error, result) => {
    if (error) {
      console.log(error);
    }
    
    //SES part
    const subject = "You Got Your Answer"
    const message = `
    
    Hola ${result.Quser} 
    
    Your Question : ${data.Qtitle}

    We got an Answer From : ${data.Ansuser}

    Visit our site to see the answer
    
    Heppy Learning :)
    `;
   
    // sending mail id <-- verified at aws ses <-- you need to verifed it first
    const from = "nit.pc058@gmail.com";
    const param_ses = {
      Destination: {
        ToAddresses: ["nitpc.strat@gmail.com"],//mail from table => [result.Mail],
      },
      Message: {
        Body: {
          Text: { Data: message },
        },
        Subject: { Data: subject },
      },
      Source: from,
    };
    try {
      ses.sendEmail(param_ses).promise();
      console.log("done Mail");
    } catch (error) {
      console.error(error);
    }
  });

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
};
