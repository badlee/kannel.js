var m = new MSG();
localStorage.vote = (localStorage.vote || 0)+1;
localStorage.voteWiner = localStorage.voteWiner || [];
//	Un gagnant tout les 1000 messages, avec un maximum de 10 gagants
if(localStorage.vote % 1000 == 0 && 	localStorage.voteWiner.length < 10 ){
	m.msgdata = "YOU'R WINNER !!!";
	localStorage.voteWiner.push(new Buffer(sms.sender).toString());
	logger.log("List of winner",localStorage.voteWiner);
}else
		m.msgdata = "TRY AGAIN";
m.sendSMS()
