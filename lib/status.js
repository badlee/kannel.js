module.exports = {
	admin : {
		shutdown : 0,
		suspend : 1,
		resume : 2,
		identify : 3,
		restart : 4
	},
	ack : {
		success : 0,
		failed : 1,     /* do not try again (e.g. no route) */
		failed_tmp : 2, /* temporary failed, try again (e.g. queue full) */
		buffered : 3
	},
	sms : {
		mo : 0,
		mt_reply : 1,
		mt_push : 2,
		report_mo : 3,
		report_mt : 4
	}
}
