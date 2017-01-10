'use strict';


var express = require('express');
var controller = require('./productinfo.controller');
var json2xls = require('json2xls');

var router = express.Router();
router.use(json2xls.middleware);

/**
 * ##Product Information API
 * ##Product fetch and search API
 * @apiGroup Product Information
 * @api {GET} /api/product/information/fetch.json Fetch Information of  a Product
 * @apiVersion 0.0.1 
 * @apiDescription <b>API Description:</b><br/> 
	   This API will fetch all the information of products  
 *
 * @apiParam {Number} count - optional(true/false) if true then give the total count of documents in product information 
 * @apiParam {Number} limit - optional must be a valid number else default limit is 10
 *
 * **Id based filters**
 * @apiParam {String} last_id - optional must be a valid Object Id
 * @apiParam {String} first_id - optional must be a valid Object Id
 *
 * Pagination
 * @apiParam {Number} offset - optional must be a valid Number value
 *
 * Serch String 
 * @apiParam {String} searchStr - optional must be a string value(not applicable on numeric fields) 
 
 
 * @apiSuccessExample JSON object
  [{
	"_id": "586b7178504d84777998f81e",
	"type": "technical",
	"information": {
		"model": "SWARAJ 735",
		"category": "Tractor",
		"brand": "Mahindra",
		"grossWeight": 50,
		"operatingWeight": 59,
		"bucketCapacity": 66,
		"enginePower": 15000,
		"liftingCapacity": 99
	},
	"__v": 0,
	"updatedAt": "2017-01-03T09:40:08.008Z",
	"createdAt": "2017-01-03T09:40:08.007Z"
}, {
	"_id": "586b6dee504d84777998f81d",
	"type": "technical",
	"information": {
		"model": "SWARAJ 735",
		"category": "Tractor",
		"brand": "Mahindra",
		"grossWeight": 50,
		"operatingWeight": 59,
		"bucketCapacity": 66,
		"enginePower": 15000,
		"liftingCapacity": 99
	},
	"__v": 0,
	"updatedAt": "2017-01-03T09:25:02.566Z",
	"createdAt": "2017-01-03T09:25:02.562Z"
}, {
	"_id": "586b6db8ac6ca80a7724e0ce",
	"type": "technical",
	"information": {
		"model": "SWARAJ 735",
		"category": "Tractor",
		"brand": "Mahindra",
		"grossWeight": 50,
		"operatingWeight": 59,
		"bucketCapacity": 66,
		"enginePower": 15000,
		"liftingCapacity": 99
	},
	"__v": 0,
	"updatedAt": "2017-01-03T09:24:08.245Z",
	"createdAt": "2017-01-03T09:24:08.240Z"
}]
*/


router.get('/fetch.json', controller.fetch, controller.renderJson);
router.get('/fetch.xlsx',controller.fetch,controller.renderXLSX);

/**
 * @apiGroup Product Information
 * @api {POST} /api/product/information/create Save Information of  a Product
 * @apiVersion 0.0.1 
 * @apiDescription <b>API Description:</b><br/> 
	   This API will save information like technical,others in database  
	   <b>Prerequisite:</b><br/> Must be a valid combination of category,brand and model needed for saving information.
	
 * @apiParam {String} model required must be a valid model for a product
 * @apiParam {String} category required must be a valid category for a product
 * @apiParam {String} brand required must be a valid brand for a product
 * @apiParam {Number} grossWeight optional must be a numeric value
 * @apiParam {Number} operatingWeight optional must be a numeric value
 * @apiParam {Number} bucketCapacity optional must be a numeric value
 * @apiParam {Number} enginePower optional must be a numeric value
 * @apiParam {Number} liftingCapacity optional must be a numeric value
 
 * @apiSuccessExample JSON object
   {
   "msg":"Created Successfully"
   }
 */

router.post('/create', controller.create);

/**
 * @apiGroup Product Information
 * @api {PUT} /api/product/information/update Update Information of an existing Product Information
 * @apiVersion 0.0.1 
 * @apiDescription <b>API Description:</b><br/> 
	   This API will update the existing information of product  
	   <b>Prerequisite:</b><br/> Must be a valid combination of category,brand and model needed for saving information.
	
 * @apiParam {String} id required must be a valid id which exists in database
 * @apiParam {String} model required must be a valid model for a product
 * @apiParam {String} category required must be a valid category for a product
 * @apiParam {String} brand required must be a valid brand for a product
 * @apiParam {Number} grossWeight optional must be a numeric value
 * @apiParam {Number} operatingWeight optional must be a numeric value
 * @apiParam {Number} bucketCapacity optional must be a numeric value
 * @apiParam {Number} enginePower optional must be a numeric value
 * @apiParam {Number} liftingCapacity optional must be a numeric value
 
 * @apiSuccessExample JSON object
   {
   "msg":"Updated Successfully"
   }
 */

router.put('/update/:id', controller.update);

/**
 * @apiGroup Product Information
 * @api {DELETE} /api/product/information/delete Delete  Information of an Existing Product Information
 * @apiVersion 0.0.1 
 * @apiDescription <b>API Description:</b><br/> 
	   This API will update the existing information of product  
	   <b>Prerequisite:</b><br/> Id must exist in database.
	
 * @apiParam {String} id required must be a valid id which exists in database
 
 * @apiSuccessExample JSON object
   {
   "msg":"Deleted Successfully"
   }
 */

router.delete('/delete/:id', controller.delete);




module.exports = router;
