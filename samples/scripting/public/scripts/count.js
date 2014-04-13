// if you want log your activity
//		logger.log("Start SMS script");
var m = new MSG();

session.num = 1+ (session.num || 0);
m.msgdata = "NB SMS SENT : "+session.num;
m.sendSMS()
// if you want log your activity
//		logger.log("End SMS script");
