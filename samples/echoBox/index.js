const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Optional. You will see this name in eg. 'ps' or 'top' command
  process.title = 'echoBox';  // Fork workers.
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
  process.title = 'echoBox worker#'+cluster.worker.id;
  var sys = require("util");
  var kannel = require('../../lib');
  var status = kannel.status;
  var iconv = require("iconv-lite");
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
  var app = new kannel.smsbox(
    __dirname+"/../../kannel/kannel.conf?"+
    "host=$.smsbox[-1:].bearerbox-host&"+
    "port=$.core[-1:].smsbox-port&"+
    "id=$.smsbox[-1:].smsbox-id&"+
    "frequence=$.smsbox[-1:].frequence-time");

  /*
  //manual config
  var app = new kannel.smsbox({
    id   : "echoBox", // smsc id
    frequence : 1 // hearbeat
  });
  */

  //var smsbox = app.conf.smsbox[app.conf.smsbox.length-1];
  //var core = app.conf.core[app.conf.core.length-1];

  app.on("admin shutdown",function(data){
    /*Shutdown*/
    console.log("Worker#{"+ cluster.worker.id +"} Receive shutdown command...bye");
    app.close();
    process.send("kill");
  });
  app.on("sms",function(data){
    console.log("Worker#{"+ cluster.worker.id +"} Recive SMS : ",data.id,data.msgdata.toString("utf8"));
    app.write("ack",{
        nack : kannel.status.ack.success,
        time : Math.floor((new Date).getTime()/1000),
        id   : data.id
    });
    app.sendSMS({
      sender: data.receiver,
      receiver: data.sender,
      msgdata: data.msgdata,
      sms_type: status.sms.mt_reply
    }); 
  });
  app.on("error",function(e){
    console.log("Error worker#{"+ cluster.worker.id +"} : ",e.stack || e);
  });
  app.on('connect',function(){
    console.log("echoBox worker #{"+ cluster.worker.id +"} is connected to "+app.conf["host"]+":"+app.conf['port']);  
  });
  app.connect();
}