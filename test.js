var kannel = require('./lib');//require('kannel');
var status = kannel.status;
    var app = new kannel.smsbox(
    "./kannel/kannel.conf?"+
    "host=$.smsbox[-1:].bearerbox-host&"+
    "port=$.core[-1:].smsbox-port&"+
    "id=$.smsbox[-1:].smsbox-id&"+
    "frequence=$.smsbox[-1:].frequence-time");

app.on("sms",function(data){
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
app.connect();