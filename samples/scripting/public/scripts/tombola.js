logger.log("Start SMS script");
var m = new MSG();



localStorage.vote = (localStorage.vote || 0)+1;
logger.log(localStorage.vote);
if(localStorage.vote % 1000 == 0){
	m.msgdata = "NB SMS : "+localStorage.vote;
	localStorage.voteWiner = localStorage.voteWiner || [];
	localStorage.voteWiner.push(sms.sender);
	m.sendSMS()
}
logger.log("End SMS script");
