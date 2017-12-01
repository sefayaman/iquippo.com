/*connecting admin DB */
db = connect("localhost:27017/admin", "superadmin" , "SuperAdminIquippo@#$%^&234567");
/*Setting parameter*/
db.getSiblingDB('admin').runCommand({setParameter:1,failIndexKeyTooLong:false});

/*connecting sreiglobaldb DB */
db = connect("localhost:27017/sreiglobaldb_01dec","appUser","iQuippoAppUser^*$!2K17");
/*Dropping existing index*/
db.getCollection('notification').dropIndex('unique_email');
/*Creating index*/


var output = db.getCollection('notification').createIndex({ notificationType: 1, from: 1, to: 1, cc: 1, subject: 1, content:1, isSent: 1 }, { unique: true, name: "unique_email" });

print('Output:-',tojson(output));