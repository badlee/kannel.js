logger.log("Start SMS script");
var m = new MSG();

session.num = 1+ (session.num || 0);
m.msgdata = "NB SMS : "+session.num;
m.sendSMS()
logger.log("End SMS script");
