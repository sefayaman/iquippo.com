var nodemailer = require('nodemailer');
var config = require('./../config/environment');
var fs = require('fs');
// configuration ===============================================================
//var mailConfig = { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "info@auro.world", Mailpassword: "Auro!234",from:"info@auro.world"};
var mailConfig = { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "bharat.hinduja@bharatconnect.com", Mailpassword: "dumpy@180980", from:"bharat.hinduja@bharatconnect.com"};
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
	var mailOptions={
		to : data.to, //req.body.email,
		subject : data.subject,
		html : data.content
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
	var mailOptions={
		to : data.to,
		subject : data.subject,
		html : data.content
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