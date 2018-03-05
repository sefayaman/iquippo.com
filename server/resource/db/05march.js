/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/*connecting sreiglobaldb DB */
db = connect("localhost:27017/sreiglobaldb", "appUser", "iQuippoAppUser^*$!2K17");

db.paymenttransactions.update({"transactionId": "5457"}, {$set: {"payments": [{
                "paymentStatus": "success",
                "tracking_id": "107334591496",
                "totAmount": "100000.0",
                "bankname": "ICICI Bank",
                "refNo": "005028",
                "createdAt": "2018-02-15T11:08:29.324Z",
                "paymentDate": "2018-02-15T11:08:29.324Z",
                "amount": 100000,
                "paymentModeType": "Debit Card"
            },
            {
                "paymentModeType": "Net Banking",
                "amount": 100000,
                "paymentDate": "2018-02-15T15:19:13.182Z",
                "createdAt": "2018-02-15T15:19:13.182Z",
                "refNo": "180460796780",
                "bankname": "HDFC Bank",
                "totAmount": "100000.0",
                "tracking_id": "107334693383",
                "paymentStatus": "success"
            }]}});