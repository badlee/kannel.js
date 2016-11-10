// if you want log your activity
// 		logger.log("Start SMS script");
var m = new MSG();

var serviceName = sms.keywords.shift();
sms = sms.keywords.join(" ");

if(!sms){
	m.msgdata = "Quel est votre nom? envoyez : HELLO [votre nom]";
}else{
	sharedStorage.name = sms;
	m.msgdata = "Bonjour "+sms;
}

m.sendFlash()
// if you want log your activity
//		logger.log("End SMS script");
