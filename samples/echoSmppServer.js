process.title = 'echoSMPP';

var user = {
	id : "oshimin",
	password : "badlee",
	type : "SMPP"
}

function checkAsyncUserPass(pdu,fn){
	fn(pdu.system_id == user.id && pdu.password == user.password ? null : ( pdu.system_type == user.system_type ? null : smpp.ESME_RINVPASWD));
}
var smpp = require('smpp');
var server = smpp.createServer(function(session) {
    session.on('bind_transceiver', function(pdu) {
    	// we pause the session to prevent further incoming pdu events,
        // untill we authorize the session with some async operation.
        session.pause();
        checkAsyncUserPass(pdu, function(err) {
            if (err) {
                session.send(pdu.response({ command_status: err }));
                session.close();
            }else{
                console.log("User connected : "+pdu.system_id);
		        session.send(pdu.response());
		        session.resume();
	        }
        });
    });
    session.on('submit_sm', function(pdu) {
        console.log("Recieve SMS  ","[From : "+pdu.source_addr+"]","[To: "+pdu.destination_addr+"]","<<"+pdu.short_message.message+">>");
        var msgid = (Math.random().toString(16)+"000000000").substr(2,12); // generate a message_id for this message.
        session.send(pdu.response({
	        message_id: msgid,
	        destination_addr : pdu.source_addr,
	        source_addr : pdu.destination_addr
        }));
    });

    session.on('unbind', function(pdu) {
        session.send(pdu.response());
        session.close();
    });

    session.on('enquire_link', function(pdu) {
        session.send(pdu.response());
    });

});
server.listen(2775);

console.log("The echo SMPP server listen 2775.");
console.log("User informations :");
console.log("\tsystem_id : "+user.id);
console.log("\tsystem_password : "+user.password);
