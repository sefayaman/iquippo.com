var nodemailer = require('nodemailer');
var config = require('./../config/environment');
var fs = require('fs');
// configuration ===============================================================
var mailConfig = config.mailConfig;
// console.log(mailConfig);
//var mailConfig = { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "info@iquippo.com", Mailpassword: "Quippo123#@!",from:"info@iquippo.com"};
//var mailConfig = { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "iquippo.uat@gmail.com", Mailpassword: "pass12345678",from:"info@iquippo.com"};
//var mailConfig = { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "bharat.hinduja@bharatconnect.com", Mailpassword: "dumpy@180980", from:"bharat.hinduja@bharatconnect.com"};
var email = {};
var transport = null;
// create reusable transporter object using SMTP transport
var transport = nodemailer.createTransport({
    service: 'Gmail',
    secureConnection: true, // use SSL
    auth: {
        user: mailConfig.Mailusername,
        pass: mailConfig.Mailpassword
    }
});


email.sendMail = function(data,req,res,cb) {
	
	if(!data || !data.to){
		if(cb)
			cb(req,res,false);
		return;
	}

	var mailOptions = {};
        if(data.to==='sibadatta.mohanty@srei.com'){data.to='sibadattamohanty@srei.co';} //to correction auto email//
	if(data.cc) {
		mailOptions={
		to : data.to, //req.body.email,
		cc : data.cc,
		subject : data.subject,
		html : data.content
		}
	} else {
		mailOptions={
		to : data.to, //req.body.email,
		subject : data.subject,
		html : data.content
		}
	}

	if(data.from)
		mailOptions['from'] = data.from;
	else
		mailOptions['from'] = mailConfig.from;

	transport.sendMail(mailOptions, function(error, response){
	if(error){
		if(cb){
			cb(req,res,false);
			console.log("Error in sending mail", error);
		}else
		console.log("Error in sending mail", error);
	}else{
		if(cb){
			cb(req,res,true);
		}else
		//console.log("Message sent: " + response.message);
		console.log("Message sent: " + response.response);
	}
		transport.close();
	});
}

email.autoMail = function(data,cb) {
	if(!data || !data.to){
		if(cb)
			cb(false);
		return;
	}

	var mailOptions = {};
        if(data.to==='sibadatta.mohanty@srei.com'){data.to='sibadattamohanty@srei.co';} //to correction auto email//
	if(data.cc) {
		mailOptions={
		to : data.to, //req.body.email,
		cc : data.cc,
		subject : data.subject,
		html : data.content
		}
	} else {
		mailOptions={
		to : data.to, //req.body.email,
		subject : data.subject,
		html : data.content
		}
	}
	if(data.from)
		mailOptions['from'] = data.from;
	else
		mailOptions['from'] = mailConfig.from;
	if(data.document){
		mailOptions['attachments'] = [{
			                    filename: data.document,
                                content: fs.createReadStream(config.root + "/" + config.uploadPath + "import/" + data.document)
                              }];
	}
	
	transport.sendMail(mailOptions, function(error, response){
	if(error){
		if(cb){
			cb(false);
			console.log("Error in sending mail", error);
		}else
		console.log("Error in sending mail", error);
	}else{
		if(cb){
			cb(true);
		}else
		console.log("Message sent: " + response.response);
	}
		transport.close();
	});
}
module.exports = email