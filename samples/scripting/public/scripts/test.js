logger.log("Start SMS script");

var m = new MSG();

m.msgdata = "Cool from js";
m.sendSMS()

logger.log("End SMS script");
