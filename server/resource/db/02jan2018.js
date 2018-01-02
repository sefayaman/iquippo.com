/*connecting sreiglobaldb DB */
db = connect("localhost:27017/sreiglobaldb","appUser","iQuippoAppUser^*$!2K17");

/*Create a full text search index on bookademos */
var output = db.bookademos.createIndex({ "$**": "text" },{ name: "searchIndex" });
print('Output:-',tojson(output));

/*Create a full text search index on newequipmentbulkorders */
output =  db.newequipmentbulkorders.createIndex({ "$**": "text" },{ name: "searchIndex" });
print('Output:-',tojson(output));

/*Create a full text search index on newofferrequests */
output = db.newofferrequests.createIndex({ "$**": "text" },{ name: "searchIndex" });
print('Output:-',tojson(output));

/*Create a full text search index on techspecvaluemasters */
output = db.techspecvaluemasters.createIndex({ "$**": "text" },{ name: "searchIndex" });
print('Output:-',tojson(output));

/*Create a full text search index on offers */
output = db.offers.createIndex({ "$**": "text" },{ name: "searchIndex" });
print('Output:-',tojson(output));

/*Update status flag for rejected bids */
output = db.assetsalebids.update({"bidStatus" : "Rejected","dealStatus": "Offer Rejected"}, {$set:{'status': false}},{multi:true});
print('Output:-',tojson(output));




