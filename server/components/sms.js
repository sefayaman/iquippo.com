var request = require('request');
// configuration ===============================================================
var smsConfig = {
	host: "https://control.msg91.com",
	URL: "/api/sendhttp.php",
	sender: "iQuipo",
	authKey: "129263AJDKJkzoHwY4580e186b",
	route: 4
}
var sms = {}
sms.sendSMS = function(data, req, res, cb) {
	
	//var path = smsConfig.URL + "?user=" + smsConfig.user + "&password=" + smsConfig.password +  "&to=" + data.to+ "&from=" + smsConfig.from + "&message="+encodeURI(data.content);
	var path = smsConfig.URL + "?authkey=" + smsConfig.authKey + "&mobiles=" + ((data.countryCode || "91") + data.to) + "&sender=" + smsConfig.sender + "&message=" + encodeURI(data.content) + "&route=" + smsConfig.route + "&country=" + data.countryCode ||  "91";

	console.log(path);

	request(smsConfig.host + path, {
		timeout: 5 * 60 * 60 * 1000
	}, function(error, response, body) {
		if (!error) {
			if (response.statusCode == 200) {
				if (cb) {
					cb(req, res, true);
				} else {
					console.log("response from server ", body);
				}
			} else {
				cb(req, res, false);
			}
		} else {
			if (error.code === 'ETIMEDOUT') {
				console.log("Remote server is very slow >>>>>>>>>>>>>>  ", error);
			}
			if (error.connect === true) {
				console.log("Not able to connect remote host server >>>>>>>>>>>>>>> ", error);
			}
			if (cb) {
				console.log("error >>>>>>>>>>>>>>> ", error);
				cb(req, res, false);
			} else {
				console.log("Error >>>>>>>>>>> ", error);
			}
		}
	});

}

sms.autoSMS = function(data, cb) {

	//var path = smsConfig.URL + "?user=" + smsConfig.user + "&password=" + smsConfig.password +  "&to=" + data.to+ "&from=" + smsConfig.from + "&message="+encodeURI(data.content);
	var path = smsConfig.URL + "?authkey=" + smsConfig.authKey + "&mobiles=" + ((data.countryCode || "91") + data.to) + "&sender=" + smsConfig.sender + "&message=" + encodeURI(data.content) + "&route=" + smsConfig.route + "&country=" + data.countryCode || "91";
	request(smsConfig.host + path, {
		timeout: 5 * 60 * 60 * 1000
	}, function(error, response, body) {
		if (!error) {
			if (response.statusCode == 200) {
				if (cb) {
					cb(true);
				} else {
					console.log("response from server ", body);
				}
			} else {
				cb(false);
			}
		} else {
			if (error.code === 'ETIMEDOUT') {
				console.log("Remote server is very slow >>>>>>>>>>>>>>  ", error);
			}
			if (error.connect === true) {
				console.log("Not able to connect remote host server >>>>>>>>>>>>>>> ", error);
			}
			if (cb) {
				console.log("error >>>>>>>>>>>>>>> ", error);
				cb(false);
			} else {
				console.log("Error >>>>>>>>>>> ", error);
			}
		}
	});

}

module.exports = sms