'use strict';

module.exports = {
	'ADMIN_FIELDS':{
		"Ticket Id":{key :"ticketId"},
		"Asset Id" :{key :"product.assetId"},
		"Asset Name":{key :"product.name"},
		"MFG Year": {key :"product.mfgYear"},
		"Asset Country": {key :"product.country"},
		"Asset Location" :{key :"product.city"},
                "Seller Customer ID": {key:"sellerCustomerId"},
		"Seller Name" :{key :"product.seller.name"},
		"Seller Contact No.":{key :"product.seller.mobile"},
                "Buyer Customer ID": {key:"buyerCustomerId"},
		"Buyer Name" :{key :"buyerName"},
		"Buyer Mobile No.":{key :"user.mobile"},
		"Buyer Email Id":{key :"user.email"},
		"Asset Description" :{key : "product.proData.comment"},
		"Offer Type" :{key :"offerType"},
		"Total Amount" :{key :"bidAmount"},
		"Bid Amount" :{key :"actualBidAmount"},
		"TCS" :{key :"tcs"},
		"Parking" :{key :"parkingCharge"},
		"EMD Amount" :{key :"emdAmount"},
		//"Full Payment Excluding EMD" :{key :"fullPaymentAmount"},
		"Parking Payment To" :{key :"parkingPaymentTo"},
		"Offer Status" :{key :"offerStatus"},
		"Bid Status" :{key : "bidStatus"},
		"Deal Status" :{key : "dealStatus"},
		"Approved By" :{key : "approvedBy"},
		"Approval Date" :{key : "approvalDate",type:'date'},
		"Approval Time" :{key : "approvalTime",type:'date'},
		"Bid Status Update By" :{key : "bidStatusUpdateBy"},
		"Deal Status Updated By" :{key : "dealStatusUpdatedBy"},
		"Date of Delivery" :{key : "dateOfDelivery",type:'date'},
		"Proxy Bid" : {key : "proxyBid",type:"boolean"},
		"Request Date":{key:"createdAt",type:'date'},
		"Request Time":{key:"createdAt",type:'datetime'},
		"Last Modified Date":{key:"updatedAt",type:'date'},
		"Last Modified Time":{key:"updatedAt",type:'datetime'},
		"Feedback" : {key :"comment"},
		"Payment Mode" : {key :"paymentMode"},
		"Bank Name" : {key :"bankName"},
		"Instrument No" : {key :"instrumentNo"},
		"Amount" : {key :"amount"},
		"Payment Date" : {key:"paymentDate",type:'date'},
		"Date of Payment Entry" : {key:"createdAt",type:'date'}
	},
	'SELLER_FIELDS':{
		"Ticket Id":{key :"ticketId"},
		"Asset Id" :{key :"product.assetId"},
		"Asset Name":{key :"product.name"},
		"MFG Year": {key :"product.mfgYear"},
		"Asset Country": {key :"product.country"},
		"Asset Location" :{key :"product.city"},
		"Asset Description" :{key : "product.proData.comment"},
		"Offer Type" :{key :"offerType"},
		"Total Amount" :{key :"bidAmount"},
		"Bid Amount" :{key :"actualBidAmount"},
		"TCS" :{key :"tcs"},
		"Parking" :{key :"parkingCharge"},
		"EMD Amount" :{key :"emdAmount"},
		//"Full Payment Excluding EMD" :{key :"fullPaymentAmount"},
		"Parking Payment To" :{key :"parkingPaymentTo"},	
		"Offer Status" :{key :"offerStatus"},
		"Bid Status" :{key : "bidStatus"},
		"Deal Status" :{key : "dealStatus"},
		"Approved By" :{key : "approvedBy"},
		"Approval Date" :{key : "approvalDate",type:'date'},
		"Approval Time" :{key : "approvalTime",type:'date'},
		"Bid Status Update By" :{key : "bidStatusUpdateBy"},
		"Deal Status Updated By" :{key : "dealStatusUpdatedBy"},
		"Date of Delivery" :{key : "dateOfDelivery",type:'date'},
		"Proxy Bid" : {key : "proxyBid",type:"boolean"},
		"Request Date":{key:"createdAt",type:'date'},
		"Request Time":{key:"createdAt",type:'datetime'},
		"Last Modified Date":{key:"updatedAt",type:'date'},
		"Last Modified Time":{key:"updatedAt",type:'datetime'},
		"Feedback" : {key :"comment"}
	},
	'BUYER_FIELDS':{
		"Ticket Id":{key :"ticketId"},
		"Asset Id" :{key :"product.assetId"},
		"Asset Name":{key :"product.name"},
		"MFG Year": {key :"product.mfgYear"},
		"Asset Country": {key :"product.country"},
		"Asset Location" :{key :"product.city"},
		"Asset Description" :{key : "product.proData.comment"},
		"Total Amount" :{key :"bidAmount"},
		"Bid Amount" :{key :"actualBidAmount"},
		"TCS" :{key :"tcs"},
		"Parking" :{key :"parkingCharge"},
		"EMD Amount" :{key :"emdAmount"},
		//"Full Payment Excluding EMD" :{key :"fullPaymentAmount"},
		"Parking Payment To" :{key :"parkingPaymentTo"},	
		"Offer Status" :{key :"offerStatus"},
		"Deal Status" :{key : "dealStatus"},
		"Approved By" :{key : "approvedBy"},
		"Approval Date" :{key : "approvalDate",type:'date'},
		"Approval Time" :{key : "approvalTime",type:'date'},
		"Bid Status Update By" :{key : "bidStatusUpdateBy"},
		"Deal Status Updated By" :{key : "dealStatusUpdatedBy"},
		"Date of Delivery" :{key : "dateOfDelivery",type:'date'},
		"Proxy Bid" : {key : "proxyBid",type:"boolean"},
		"Request Date":{key:"createdAt",type:'date'},
		"Request Time":{key:"createdAt",type:'datetime'},
		"Last Modified Date":{key:"updatedAt",type:'date'},
		"Last Modified Time":{key:"updatedAt",type:'datetime'},
		"Feedback" : {key :"comment"}
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
		"Total Amount" :{key :"bidAmount"},
		"Bid Amount" :{key :"actualBidAmount"},
		"TCS" :{key :"tcs"},
		"Parking" :{key :"parkingCharge"},
		"EMD Amount" :{key :"emdAmount"},
		//"Full Payment Excluding EMD" :{key :"fullPaymentAmount"},
		"Parking Payment To" :{key :"parkingPaymentTo"},	
		"Offer Status" :{key :"offerStatus"},
		"Bid Status" :{key : "bidStatus"},
		"Deal Status" :{key : "dealStatus"},
		"Approved By" :{key : "approvedBy"},
		"Approval Date" :{key : "approvalDate",type:'date'},
		"Approval Time" :{key : "approvalTime",type:'date'},
		"Bid Status Update By" :{key : "bidStatusUpdateBy"},
		"Deal Status Updated By" :{key : "dealStatusUpdatedBy"},
		"Date of Delivery" :{key : "dateOfDelivery",type:'date'},
		"Proxy Bid" : {key : "proxyBid",type:"boolean"},
		"Request Date":{key:"createdAt",type:'date'},
		"Request Time":{key:"createdAt",type:'datetime'},
		"Last Modified Date":{key:"updatedAt",type:'date'},
		"Last Modified Time":{key:"updatedAt",type:'datetime'},
		"Feedback" : {key :"comment"}
	},
	'EXPORT_PAYMENT':{
		"Ticket Id":{key :"ticketId"},
		"Asset Id" :{key :"assetId"},
		"Asset Name":{key :"assetName"},
		"Buyer Name" :{key :"buyerName"},
		"Buyer Mobile No.":{key :"buyerMobile"},
		"Buyer Email Id":{key :"buyerEmail"},
		"Payment Mode":{key:"paymentMode"},
		"Bank Name":{key:"bankName"},
		"Instrument No":{key:"instrumentNo"},
		"Amount":{key:"amount"},
		"Payment Date":{key:"paymentDate",type:'date'},
		"Date of Entry":{key:"createdAt",type:'date'}
	}
}