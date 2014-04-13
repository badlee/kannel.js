var m = new MSG(),
	votes = ["A","B","C","D"];
total = 0;
localStorage.vote = localStorage.vote || {};
if(votes.indexOf((sms.keywords[1] || "").toUpperCase()) != -1){
	if(sms.keywords[1])
		localStorage.vote[sms.keywords[1]] = 1 +(localStorage.vote[sms.keywords[1]] || 0);
	for(var i in votes)
		total+=(localStorage.vote[votes[i]] || 0);
	m.msgdata = "VOTE  ["+total+"] : ";
	for(var i in votes)
		m.msgdata+=" "+votes[i]+"["+((localStorage.vote[votes[i]] || 0 )/total*100).toFixed(2)+"%("+(localStorage.vote[votes[i]] || 0 )+")]";
}else if(!sms.keywords[1]){
	m.msgdata = "Evoyez VOTE suivit de votre vote. Ex : VOTE "+votes.rnd;
} else
	m.msgdata = "VOTE POSSIBLE : "+ votes.join(" ")+" , not "+sms.keywords[1];
m.sendSMS()
// if you want log your activity
//logger.log("Console.log message");
