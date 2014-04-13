logger.log("Start SMS script");
var m = new MSG();

key = sms.keywords.shift();
sms = sms.keywords.join(" ");
logger.log(session);
session[session.nom ? (session.prenom ? "age" : "prenom") : "nom"] = sms;
if(!session.nom){
	m.msgdata = "Quel est votre nom. HELLO [votre nom]";
}else if (!session.prenom){
	m.msgdata = "Quel est votre prenom. HELLO [votre prenom]";
}else if (!session.age){
	m.msgdata = "Quel est votre age. HELLO [votre age]";
}else{
	m.msgdata = "Bonjour "+session.nom+" "+session.prenom+" "+session.age;
}
m.sendSMS()

logger.log("End SMS script");
