/*connecting sreiglobaldb DB */
db = connect("localhost:27017/sreiglobaldb","appUser","iQuippoAppUser^*$!2K17");

/*update user role as admin */
output = db.users.update({"mobile" : "9831368286", "status": true},{$set:{"role":"admin"}});
print('Output:-',tojson(output));

output = db.users.update({"mobile" : "9830577807", "status": true},{$set:{"role":"admin"}});
print('Output:-',tojson(output));

output = db.users.update({"mobile" : "8779034686", "status": true},{$set:{"role":"admin"}});
print('Output:-',tojson(output));

output = db.users.update({"mobile" : "9830630003", "status": true},{$set:{"role":"admin"}});
print('Output:-',tojson(output));

output = db.users.update({"mobile" : "9830691929", "status": true},{$set:{"role":"admin"}});
print('Output:-',tojson(output));

output = db.users.update({"mobile" : "8927630007", "status": true},{$set:{"role":"admin"}});
print('Output:-',tojson(output));

/*update user role as admin */
output = db.users.update({mobile:"9810162035", customerId:"IQ117328"},{$set:{status:false}});
print('Output:-',tojson(output));