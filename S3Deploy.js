var fs = require('fs');
var util = require('util');
var aws = require('aws-sdk');
var config = require('./S3DeployConf');
var path = require('path');
var recursive = require('recursive-readdir');

var BUCKET_NAME = config.BUCKET_NAME;
aws.config.loadFromPath(config.AwsConfig);

var s3 = new aws.S3();

if (process.argv.length < 3) noParamsGiven();
else runWithParams();

function noParamsGiven() {
  showUsage();
  process.exit(-1);
}

function getContentTypeByFile(fileName) {
  var rc = 'application/octet-stream';
  var fileNameLowerCase = fileName.toLowerCase();

  if (fileNameLowerCase.indexOf('.html') >= 0) rc = 'text/html';
  else if (fileNameLowerCase.indexOf('.css') >= 0) rc = 'text/css';
  else if (fileNameLowerCase.indexOf('.json') >= 0) rc = 'application/json';
  else if (fileNameLowerCase.indexOf('.js') >= 0) rc = 'application/x-javascript';
  else if (fileNameLowerCase.indexOf('.png') >= 0) rc = 'image/png';
  else if (fileNameLowerCase.indexOf('.jpg') >= 0) rc = 'image/jpg';

  return rc;
}

function showUsage() {
  console.log('Use choosing one of these command line parameters:');
  console.log('create_bucket');
  console.log('update_all');
  console.log('styles');
  console.log('scripts');
  console.log('images');
  console.log('bower');
}

function uploadFile(remoteFilename, fileName) {
  var fileBuffer = fs.readFileSync(fileName);
  var metaData = getContentTypeByFile(fileName);

  s3.putObject({
    ACL: 'public-read',
    Bucket: BUCKET_NAME,
    Key: remoteFilename,
    Body: fileBuffer,
    ContentType: metaData
  }, function(error, response) {
    util.log('uploaded file[' + fileName + '] to [' + remoteFilename + '] as [' + metaData + ']');
  });
}

function runWithParams() {
  console.log('S3 Deployer ... running option is [' + process.argv[2] + ']');
  var type = process.argv[2];
  if(type == 'create_bucket'){
    createBucket(BUCKET_NAME);
  }else if(type != null){
    uploadSource(type);
  }else{
    console.log('...that option isn\'t recognized');
  }
}

function createBucket(bucketName) {
  s3.createBucket({Bucket: bucketName}, function() {
    console.log('created the bucket[' + bucketName + ']')
  });
}

function uploadSource(type) {
  recursive(config[type].local, function (err, files) {
    files.forEach(function(file){
      var filePath = path.dirname(file),
          fileName = path.basename(file);

      var firstPath = config[type].local,
          secondPath = filePath,
          firstPathDeconstruct = firstPath.split(path.sep),
          secondPathDeconstruct = secondPath.split(path.sep),
          remoteFilePath = '';

      secondPathDeconstruct.forEach(function(chunk) {
        if (firstPathDeconstruct.indexOf(chunk) < 0) {
          remoteFilePath += (chunk + '/');
        }
      })
      remoteFilePath = config[type].remote + remoteFilePath + fileName;
      uploadFile(remoteFilePath, filePath + '/' + fileName);
    });
  });
};
