/*connecting sreiglobaldb DB */
db = connect("localhost:27017/sreiglobaldb","appUser","iQuippoAppUser^*$!2K17");

/*Create a full text search index on bookademos */
var output = db.legalentitytypes.createIndex({ "$**": "text" },{ name: "searchIndex" });
print('Output:-',tojson(output));

/*Create a full text search index on newequipmentbulkorders */
output =  db.bankmasters.createIndex({ "$**": "text" },{ name: "searchIndex" });
print('Output:-',tojson(output));



