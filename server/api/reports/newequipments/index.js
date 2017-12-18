'use strict';

var newequipments = require('./newequipments');


module.exports = function(app){
   app.get('/newequipments/fetch.json', newequipments.fetch, newequipments.renderJson);
   app.get('/newequipments/fetch.xlsx', newequipments.fetch, newequipments.renderCsv);
   app.get('/newequipments/fetch.count.json', newequipments.count);
};