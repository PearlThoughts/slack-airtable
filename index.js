require('dotenv').config();
var express = require('express')
var app = express()
var Slack = require('slack-node');
var Airtable = require('airtable-node');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
});

const uploadFile = () => {
  const params = {
    Bucket: 'slack-airtable', // pass your bucket name
    Key: 'airtable2.json', // file will be saved as testBucket/contacts.csv
  };
  s3.headObject(params).on('success', function(response) {
    s3.getObject(params, function(err, data) {
      let objectData = data.Body.toString(); 
      uploadFiletoS3(JSON.parse(objectData));
    }); 
  }).on('error',function(error){
    var airtableData = [];
    uploadFiletoS3(airtableData);
  }).send();
};

function uploadFiletoS3(data) {
  var airtableData = {
    "inprogress" : 7,
    "backlog" : 8
  }
  console.log(data);
  data.push(airtableData);
  console.log(data);
  const params = {
    Bucket: 'slack-airtable', // pass your bucket name
    Key: 'airtable2.json', // file will be saved as testBucket/contacts.csv
    Body: JSON.stringify(data)
  };
  s3.upload(params, function(s3Err, data) {
      if (s3Err) throw s3Err
      console.log(`File uploaded successfully at ${data.Location}`)
  });
}

uploadFile();

slackApiToken = process.env.SLACK_AUTH_TOKEN;
airtableApiToken = process.env.AIRTABLE_API_KEY;
airtableBase = process.env.AIRTABLE_BASE_ID;
airtableTable = process.env.AIRTABLE_TABLE_ID;
airtableView = process.env.AIRTABLE_VIEW_ID;
airtable = new Airtable({apiKey: airtableApiToken, base: airtableBase, table: airtableTable, view : airtableView})

function getAritableList(airtable, filter) {
  return airtable.list({
    filterByFormula: filter, 
  });
}

slack = new Slack(slackApiToken);

app.post('/', function (req, res) {
  console.log(process.env.SLACK_CHANNEL);
  var p1 = getAritableList(airtable, `status = 'Backlog'`);
  var p2 = getAritableList(airtable, `status = 'In-progress'`);
  var p3 = getAritableList(airtable, `status = 'Internal QA'`);
  var p4 = getAritableList(airtable, `status = 'Push to Prod'`);
  var p5 = getAritableList(airtable, `status = 'Customer QA'`);
  var p6 = getAritableList(airtable, `status = 'Customer Clarify'`);
  var p7 = getAritableList(airtable, `status = 'Need Design'`);
  var p8 = getAritableList(airtable, `status = 'Blocked – John'`);
  var p9 = getAritableList(airtable, `status = 'Complete'`);

  Promise.all([p1, p2, p3, p4, p5, p6, p7, p8, p9]).then(values => { 
    console.log(values);
    var backlog = Object.keys(values[0].records).length;
    var inprogress = Object.keys(values[1].records).length;
    var internalQa = Object.keys(values[2].records).length;
    var pushToProd = Object.keys(values[3].records).length;
    var customerQa = Object.keys(values[4].records).length;
    var customerClarify = Object.keys(values[5].records).length;
    var needDesign = Object.keys(values[6].records).length;
    var blockedJohn = Object.keys(values[7].records).length;
    var complete = Object.keys(values[8].records).length;

    console.log('Backlog:', backlog);
    console.log('In-progress:', inprogress);
    console.log('Internal QA:', internalQa);
    console.log('Push to Prod:', pushToProd);
    console.log('Customer QA:', customerQa);
    console.log('Customer Clarify:', customerClarify);
    console.log('Need Design:', needDesign);
    console.log('Blocked - John:', blockedJohn);
    console.log('Complete:', complete);

    var messge =  "``` Backlog: " + backlog + "\n In-progress: " + inprogress + "\n Internal QA: " + internalQa + "\n Push to Prod: " + pushToProd + "\n Customer QA: " + customerQa + "\n Customer Clarify: " + customerClarify+ "\n Need Design: " + needDesign + "\n Blocked - John: " + blockedJohn+  "\n Complete: " + complete + "```";


    slack.api('chat.postMessage', {
      text: messge,
      channel: process.env.SLACK_CHANNEL,
      username: 'Bot'
    });
  })
  .catch((err) => {
    console.log('Value is empty');    
  });
})

app.listen(3000, () => console.log("App listening on port 3000!"));