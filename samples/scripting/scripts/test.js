logger.log("Je suis un log");

var m = new MSG();

m.msgdata = "Je suis une service SMS";
m.sendSMS()

logger.log("End SMS script");
