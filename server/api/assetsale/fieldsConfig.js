'use strict';

module.exports = {
	'ADMIN_FIELDS':{
		"Ticket Id":{key :"ticketId"},
		"Asset Id" :{key :"product.assetId"},
		"Asset Name":{key :"product.name"},
		"MFG Year": {key :"product.mfgYear"},
		"Asset Country": {key :"product.country"},
		"Asset Location" :{key :"product.city"},
		"Seller Name" :{key :"product.seller.name"},
		"Seller Contact No.":{key :"product.seller.mobile"},
		"Buyer Name" :{key :"buyerName"},
		"Buyer Mobile No.":{key :"user.mobile"},
		"Buyer Email Id":{key :"user.email"},
		"Asset Description" :{key : "product.proData.comment"},
		"Offer Type" :{key :"offerType"},
		"Bid Amount" :{key :"bidAmount"},
		"TCS" :{key :"tcs"},
		"Parking" :{key :"parkingCharge"},
		"EMD Amount" :{key :"emdAmount"},
		"Full Payment Amount" :{key :"fullPaymentAmount"},
		"Parking Payment To" :{key :"parkingPaymentTo"},
		"Offer Status" :{key :"offerStatus"},
		"Bid Status" :{key : "bidStatus"},
		"Deal Status" :{key : "dealStatus"},
		"Date of Delivery" :{key : "dateOfDelivery",type:'date'},
		"Proxy Bid" : {key : "proxyBid",type:"boolean"},
		"Request Date":{key:"createdAt",type:'date'}
	},
	'SELLER_FIELDS':{
		"Ticket Id":{key :"ticketId"},
		"Asset Id" :{key :"product.assetId"},
		"Asset Name":{key :"product.name"},
		"MFG Year": {key :"product.mfgYear"},
		"Asset Country": {key :"product.country"},
		"Asset Location" :{key :"product.city"},
		"Buyer Name" :{key :"buyerName"},
		"Buyer Mobile No.":{key :"user.mobile"},
		"Buyer Email Id":{key :"user.email"},
		"Asset Description" :{key : "product.proData.comment"},
		"Offer Type" :{key :"offerType"},
		"Bid Amount" :{key :"bidAmount"},
		"TCS" :{key :"tcs"},
		"Parking" :{key :"parkingCharge"},
		"EMD Amount" :{key :"emdAmount"},
		"Full Payment Amount" :{key :"fullPaymentAmount"},
		"Parking Payment To" :{key :"parkingPaymentTo"},	
		"Offer Status" :{key :"offerStatus"},
		"Bid Status" :{key : "bidStatus"},
		"Deal Status" :{key : "dealStatus"},
		"Date of Delivery" :{key : "dateOfDelivery",type:'date'},
		"Proxy Bid" : {key : "proxyBid",type:"boolean"},
		"Request Date":{key:"createdAt",type:'date'}
	},
	'BUYER_FIELDS':{
		"Ticket Id":{key :"ticketId"},
		"Asset Id" :{key :"product.assetId"},
		"Asset Name":{key :"product.name"},
		"MFG Year": {key :"product.mfgYear"},
		"Asset Country": {key :"product.country"},
		"Asset Location" :{key :"product.city"},
		"Asset Description" :{key : "product.proData.comment"},
		"Bid Amount" :{key :"bidAmount"},
		"TCS" :{key :"tcs"},
		"Parking" :{key :"parkingCharge"},
		"EMD Amount" :{key :"emdAmount"},
		"Full Payment Amount" :{key :"fullPaymentAmount"},
		"Parking Payment To" :{key :"parkingPaymentTo"},	
		"Offer Status" :{key :"offerStatus"},
		"Deal Status" :{key : "dealStatus"},
		"Date of Delivery" :{key : "dateOfDelivery",type:'date'},
		"Proxy Bid" : {key : "proxyBid",type:"boolean"},
		"Request Date":{key:"createdAt",type:'date'}
	},
	'FA_FIELDS':{
		"Ticket Id":{key :"ticketId"},
		"Asset Id" :{key :"product.assetId"},
		"Asset Name":{key :"product.name"},
		"MFG Year": {key :"product.mfgYear"},
		"Asset Country": {key :"product.country"},
		"Asset Location" :{key :"product.city"},
		"Seller Name" :{key :"product.seller.name"},
		"Seller Contact No.":{key :"product.seller.mobile"},
		"Buyer Name" :{key :"buyerName"},
		"Buyer Mobile No.":{key :"user.mobile"},
		"Buyer Email Id":{key :"user.email"},
		"Asset Description" :{key : "product.proData.comment"},
		"Offer Type" :{key :"offerType"},
		"Bid Amount" :{key :"bidAmount"},
		"TCS" :{key :"tcs"},
		"Parking" :{key :"parkingCharge"},
		"EMD Amount" :{key :"emdAmount"},
		"Full Payment Amount" :{key :"fullPaymentAmount"},	
		"Parking Payment To" :{key :"parkingPaymentTo"},	
		"Offer Status" :{key :"offerStatus"},
		"Bid Status" :{key : "bidStatus"},
		"Deal Status" :{key : "dealStatus"},
		"Date of Delivery" :{key : "dateOfDelivery",type:'date'},
		"Proxy Bid" : {key : "proxyBid",type:"boolean"},
		"Request Date":{key:"createdAt",type:'date'}
	}
}