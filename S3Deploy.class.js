/*
* Author     : Daniel Ortega
* Author URI : daniel-ortega.mx
* Email      : me@daniel-ortega.mx
* Github     : http://github.com/gatero
* Project    : git@github.com:gatero/gulp-webapp.git
*/

// Globals
var fs          = require('fs'),
    util        = require('util'),
    aws         = require('aws-sdk'),
    path        = require('path'),
    recursive   = require('recursive-readdir'),
    // Read configuration from S3DeployConf.json
    config      = require('./S3DeployConf'),
    // Obtains the bucket name from configuration
    BUCKET_NAME = config.BUCKET_NAME;

// AWS init
aws.config.loadFromPath(config.AwsConfig);
var s3          = new aws.S3();

// Object constructor
var S3Deploy = function() {}

// if no params are passed
S3Deploy.prototype.help = function() {
  var root = this;
  root.showUsage();
}
// Show options in console
S3Deploy.prototype.showUsage = function() {
  console.log('Use choosing one of these command line parameters:');
  console.log('create_bucket');
  console.log('update_all');
  console.log('styles');
  console.log('scripts');
  console.log('images');
  console.log('bower');
}
// else...
S3Deploy.prototype.run = function(option) {
  var root = this,
      type = option;
  console.log('S3 Deployer ... running option is [' + type + ']');

  if(type == 'create_bucket'){
    root.createBucket(BUCKET_NAME);
  }else if(type != null){
    root.uploadSource(type);
  }else{
    console.log('...that option isn\'t recognized');
  }
}
// Set file type
S3Deploy.prototype.getContentTypeByFile = function(fileName) {
  var rc                = 'application/octet-stream',
      fileNameLowerCase = fileName.toLowerCase();

  if (fileNameLowerCase.indexOf('.html') >= 0) rc = 'text/html';
  else if (fileNameLowerCase.indexOf('.css') >= 0) rc = 'text/css';
  else if (fileNameLowerCase.indexOf('.json') >= 0) rc = 'application/json';
  else if (fileNameLowerCase.indexOf('.js') >= 0) rc = 'application/x-javascript';
  else if (fileNameLowerCase.indexOf('.png') >= 0) rc = 'image/png';
  else if (fileNameLowerCase.indexOf('.jpg') >= 0) rc = 'image/jpg';

  return rc;
}

/**
* S3Deploy.js core
*/

// S3 uploadfile configuration
S3Deploy.prototype.uploadFile = function(remoteFilename, fileName){
  var root       = this,
      fileBuffer = fs.readFileSync(fileName),
      metaData   = root.getContentTypeByFile(fileName);

  s3.putObject({
    ACL         : 'public-read',
    Bucket      : BUCKET_NAME,
    Key         : remoteFilename,
    Body        : fileBuffer,
    ContentType : metaData
  }, function(error, response) {

    util.log('uploaded file [' + fileName + '] to [' + remoteFilename + '] as [' + metaData + ']');
  });
}

/**
* This method reads need the bucket name from S3DeployConf.json
* and create the bucket if not exist
*/
S3Deploy.prototype.createBucket = function(bucketName) {
  s3.createBucket({Bucket: bucketName}, function() {
    console.log('Created the bucket: ' + bucketName)
  });
}

/**
* Read upload tasks from S3DeployConf.json
* each task must have local and romete paths.
*/
S3Deploy.prototype.uploadSource = function(type) {
  var root = this;
  util.log(type);
  recursive(config[type].local, function (err, files) {

    files.forEach(function(file){

      var filePath              = path.dirname(file),
          fileName              = path.basename(file),
          firstPath             = config[type].local,
          secondPath            = filePath,
          firstPathDeconstruct  = firstPath.split(path.sep),
          secondPathDeconstruct = secondPath.split(path.sep),
          remoteFilePath        = '';

      secondPathDeconstruct.forEach(function(chunk) {
        if (firstPathDeconstruct.indexOf(chunk) < 0) {
          remoteFilePath += (chunk + '/');
        }
      });

      remoteFilePath = config[type].remote + remoteFilePath + fileName;

      root.uploadFile(remoteFilePath, filePath + '/' + fileName);
    });
  });
}
// exports class
module.exports = S3Deploy;
