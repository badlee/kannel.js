const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Optional. You will see this name in eg. 'ps' or 'top' command
  process.title = 'smsToMail';  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  Object.keys(cluster.workers).forEach(function(id){
    cluster.workers[id].on('message',function(msg) {
      if(msg == "kill"){
        Object.keys(cluster.workers).forEach(function (id) {
          cluster.workers[id].kill();
        });
        process.exit();
      }
    });
  });

  cluster.on('exit', function(worker, code, signal) {
    console.log(`worker ${worker.process.pid} died`);
  });
} else if (cluster.isWorker) {
  // Optional. You will see this name in eg. 'ps' or 'top' command
  process.title = 'smsToMail worker#'+cluster.worker.id;
  var sys = require("util");
  var kannel = require('../../lib');
  'use strict';
  const nodemailer = require('nodemailer');

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: 'gmail.user@gmail.com',
          pass: 'yourpass'
      }
  });
  var status = kannel.status;
  /*

  * load config from kannel configuration file
  * url
    path_to_file?config
      path is relative or absolute path to kannel config file
      config - is a url query format field=data&field2=data&... 
        host=jsonpath selector
        port=jsonpath selector
        id=jsonpath selector
        frequence=jsonpath selector

    For jsonPath sample look at http://goessner.net/articles/JsonPath/
  */
  //*
  var app = new kannel.smsbox(
    (process.argv[2] || __dirname+"/../../kannel/kannel.conf")+"?"+
    "host=$.smsbox[-1:].bearerbox-host&"+
    "port=$.core[-1:].smsbox-port&"+
    "id=$.smsbox[-1:].smsbox-id&"+
    "frequence=$.smsbox[-1:].frequence-time");
  
  /*///manual config
  var app = new kannel.smsbox({
    host : '192.168.2.4', // bearerbox host - default '127.0.0.1'
    port : 14001, //smsc connection port - default 13001
    id   : "kanneljs", // smsc id - defaut ""
    frequence : 60 // hearbeat - default 5s
  });
  //*/

  //var smsbox = app.conf.smsbox[app.conf.smsbox.length-1];
  //var core = app.conf.core[app.conf.core.length-1];

  app.on("admin shutdown",function(data){
    /*Shutdown*/
    console.log("Worker#{"+ cluster.worker.id +"} Receive shutdown command...bye");
    app.close();
    process.send("kill");
  });
  app.on("sms",function(data){
    data.buffered();// send success ack
    transporter.sendMail({
        from: data.sender+'@smstomail.com',
        to: 'badinga.ulrich@gmail.com',
        subject: 'SMS from '+data.sender,
        text: data.msgdata.toString()
      }, function(err, reply) {
        if(err){
          data.failed();
          console.log("Worker#{"+ cluster.worker.id +"} Error on send SMS to mail : ",{
            receiver: data.receiver,
            sender: data.sender,
            msgdata: data.msgdata.toString()
          }, err.stack);
        } else {
          data.success();
          console.log("Worker#{"+ cluster.worker.id +"} Send SMS to mail : ",reply);
          app.sendSMS({
            sender: data.receiver,
            receiver: data.sender,
            msgdata: "Mail send",
            sms_type: status.sms.mt_reply
          }); 
        }
    });
  });
  app.on("error",function(e){
    console.log("Error worker#{"+ cluster.worker.id +"} : ",e.stack || e);
    if(["EPIPE","ECONNREFUSED"].indexOf(e.code) > -1)
      process.send("kill");

  });
  app.on('connect',function(){
    console.log("smsToMail worker #{"+ cluster.worker.id +"} is connected to "+app.conf["host"]+":"+app.conf['port']);  
  });
  app.connect();
}