"use strict";
var cron = require('node-cron'), 
	convert = require('./convert'), 
  email   = require('./email');

cron.schedule('* * * * *', function()
{
  console.log('running a task every minute');
  convert.processConvertVideo();
  email.sendEmail();
});
