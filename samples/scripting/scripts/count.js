// if you want log your activity
//		logger.log("Je suis un log");
var m = new MSG();
var nom = (sharedStorage.name || "").toString().toUpperCase();
session.num = 1+ (session.num || 0);
m.msgdata = (nom ? (nom+" ") : '')+"NB SMS SENT : "+session.num;
m.sendSMS()