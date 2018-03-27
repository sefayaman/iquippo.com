/*connecting sreiglobaldb DB */
db = connect("localhost:27017/sreiglobaldb","appUser","iQuippoAppUser^*$!2K17");

/*Update status flag for rejected bids */
output = db.assetsalebids.update({ticketId:"SB112787"},{$set:{"fullPayment.paymentsDetail" : [{"createdAt":"2018-03-23T14:05:42.218Z","amount":275250,"_id":"5ab509d8798f3e0305575d43","paymentDate":"2018-03-22T18:30:00.000Z",
"bankName":"UCO bank","instrumentNo":"UCBAH18082612749","paymentMode":"RTGS"}]}})
print('Output:-',tojson(output));




