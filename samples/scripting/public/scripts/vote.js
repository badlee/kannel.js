logger.log("Start SMS script");
var m = new MSG();

total = 0;
localStorage.vote = localStorage.vote || {};
if(["a","b","c","d"].indexOf((sms.keywords[1] || "").toLowerCase()) != -1){
	if(sms.keywords[1])
		localStorage.vote[sms.keywords[1]] = 1 +(localStorage.vote[sms.keywords[1]] || 0);
	for(var i in localStorage.vote)
		total+=localStorage.vote[i];
	m.msgdata = "VOTE - "+total+" : ";
	for(var i in localStorage.vote)
		m.msgdata+=", "+i.toUpperCase()+" : "+(localStorage.vote[i]/total*100).toFixed(2)+"%("+localStorage.vote[i]+")";
}else if(!sms.keywords[1]){
	m.msgdata = "Evoyez VOTE suivit de votre vote. Ex : VOTE "+["A","B","C","D"].rnd;
} else
	m.msgdata = "VOTE POSSIBLE : "+ ["A","B","C","D"].join(" ")+" , not "+sms.keywords[1];
m.sendSMS()
logger.log("End SMS script");
