// Interactiveness now

Number.prototype.toHHMMSS = function () {
    var seconds = Math.floor(this),
        hours = Math.floor(seconds / 3600);
    seconds -= hours*3600;
    var minutes = Math.floor(seconds / 60);
    seconds -= minutes*60;

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
};
var image1 = new Image(30,26);
image1.src = "/assets/img/down.png";
(function() {

	var clock = document.querySelector('digiclock');
	
	// But there is a little problem
	// we need to pad 0-9 with an extra
	// 0 on the left for hours, seconds, minutes
	
	var pad = function(x) {
		return x < 10 ? '0'+x : x;
	};
	
	var ticktock = function() {
		var d = new Date();
		
		var h = pad( d.getHours() );
		var m = pad( d.getMinutes() );
		var s = pad( d.getSeconds() );
		
		var current_time = [h,m,s].join(':');
		
		clock.innerHTML = current_time;
		
	};
	
	ticktock();
	// Calling ticktock() every 1 second
	setInterval(ticktock, 1000);
	/* ---------- Notifications ---------- */

	$('#sms_send').click(function(e){
		e.preventDefault();
			var ops = {
			    layout: 'top',
			    type: 'success',
			    timeout: 5000, // delay for closing event. Set false for sticky notifications
			    force: true, // adds notification to the beginning of queue when set to true
			    modal: true,
			    maxVisible: 1, // you can set max visible notification for dismissQueue true option,
			    killer: true, // for close all notifications before show
			};
		$.get("/cgi-bin/sendsms?"+$.param({
			from : $("#sms_from").val(),
			to : $("#sms_to").val(),
			text : $("#sms_text").val()
		}),function(){
			ops.text = "Message send"
			noty(ops);
			$('[ref="sms_field"]').val("");
		}).fail(function(){
			ops.text = "Message not send";
			ops.type = 'error';
			noty(ops);
		});
	})
}());
