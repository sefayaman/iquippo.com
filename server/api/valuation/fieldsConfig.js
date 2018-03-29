'use strict';

module.exports = {
	'EXPORT':{
		"Unique Control Number":{key:"requestId"},
		"Job ID":{key:"jobId"},
		"Status":{key:"status"},
		"Request Type":{key:"requestType"},
		"Purpose":{key:"purpose"},
		//'Original Owner' : {key:"sellerName"},
		"Agency Name":{key:"valuationAgency.name"},
		"User Customer ID":{key:"user.customerId"},
		"User":{key:"userName"},
		"User Mobile":{key:"user.mobile"},
		"Request Date":{key:"createdAt",type:'date'},
		//"Referance/FI Number":{key:"customerTransactionId"},
		"Asset No":{key:"product.assetId"},
		//"Repo. Date":{key:"repoDate",type:'date'},
		"Asset Category":{key:"product.category"},
		"Brand/Make":{key:"product.brand"},
		"Model":{key:"product.model"},
		"Asset Description":{key:"product.description"},
		//"Asset Name":{key:"assetDescription"},
		"Engine No":{key:"product.engineNo"},
		"Chassis No":{key:"product.chasisNo"},
		"Serial No":{key:"product.serialNumber"},
		"Regn No":{key:"product.registrationNo"},
		"Invoice Date":{key:"invoiceData.invoiceDate",type:'date'},
		"Invoice Value":{key:"invoiceData.invoiceAmount"},
		//"Yard Information/Asset Address":{key:"yardParked"},
		"Country":{key:"product.country"},
		"State":{key:"product.state"},
		"Location":{key:"product.city"},
		"Contact Person":{key:"contactPerson"},
		"Contact Person Tel No":{key:"contactNumber"},
		//"Distance From Customer Office":{key:"disFromCustomerOffice"},
		"Request Submitted Agency Date":{key:"submittedToAgencyDate",type:'date'},
		"Report No":{key:"reportNo"},
		"Asset No by Quippo":{key:"assetNo"},
		"Report Date":{key:"reportDate",type:'date'},
		"Year of Manufacture":{key:"agencyYearOfManufacturing"},
		"HMR / KMR":{key:"hmr_kmr"},
		"Assessed Value":{key:"assessedValue"},
		"Inspection By":{key:"inspectionBy"},
		"Physical Condition":{key:"physicalCondition"},
		//"GPS Installed":{key:"gpsInstalled",type:"boolean"},
		//"IMIE No":{key:"gpsIMEINo"},
		"GPS Device No":{key:"gpsDeviceNo"},
		"Engine Number by Quippo":{key:"agencyEngineNo"},
		"Chassis Number by Quippo":{key:"agencyChassisNo"},
		"Registration Number by Quippo":{key:"agencyRegistrationNo"},
		"Serial Number by Quippo":{key:"agencySerialNo"},
		//"Asset Image General":{key:"generalImage",type:"url"},
		//"Asset Image Engine":{key:"engineImage",type:"url"},
		//"Asset Image Hydraulic":{key:"hydraulicImage",type:"url"},
		//"Asset Image Cabin":{key:"cabinImage",type:"url"},
		//"Asset Image Under-Carriage / Tyre":{key:"underCarriageImage",type:"url"},
		//"Asset Image Others":{key:"otherImage",type:"url"},
		"Valuation Report":{key:"valuationReport",type:"url"},
		"Overall General Condition":{key:"overallGeneralCondition"},
		"Invoiced Date":{key:"invoiceData.invoiceDate",type:"date"},
		"Invoice No":{key:"invoiceData.invoiceNo"},
		"Payment Received":{key:"paymentReceived",type:"boolean"},
		"Schedule Call":{key:"schedule"},
		"Schedule Date":{key:"scheduleDate",type:'date'},
		"Schedule Time":{key:"scheduledTime"},
		"Comment":{key:"comment"}
		//"Payment Made to Agency":{key:"paymentMade",type:"boolean"}
	},
	'OLD_REQUEST_EXPORT':{
	  "Fullname": {key:"userName"},
      "Country": {key:"user.country"},
      "Location": {key:"user.city"},
      "Mobile No": {key:"user.mobile"},
      "Phone No": {key:"user.phone"},
      "Email Address": {key:"user.email"},
      "Valuation Request Id": {key:"requestId"},
      "Asset Name": {key:"product.name"},
      "Manufacturing Year": {key:"product.mfgYear"},
      "Asset Location": {key:"product.city"},
      "Machine Serial No.": {key:"product.serialNumber"},
      "Agency Name": {key:"valuationAgency.name"},
      "Request Date": {key:"createdAt",type:'date'},
      "Request Purpose": {key:"purpose"},
      "Request Status": {key:"status"}
	},
	'PUT_ON_HOLD':{
		'jobID':{key:"jobId",required:true},
		'unique_controll_no':{key:"requestId",required:true},
		'message':{key:"onHoldMsg",required:true},
	},
	'STATUS_UPDATE':{
		'jobID':{key:"jobId",required:true},
		'unique_controll_no':{key:"requestId",required:true},
		'status':{key:"status",required:true},
	},
	'REPORT_UPLOAD' :{
		  'jobID':{key:"jobId",required:true},
		  'unique_controll_no':{key:"requestId",required:true},
		  'reportNo':{key:"reportNo",required:true},
		  'assetNo':{key:"assetNo"},
		  'imeiNo':{key:"gpsIMEINo"},
		  'hmr_Kmr':{key:"hmr_kmr"},
		  'assessed_Value':{key:"assessedValue",type:'numeric'},
		  'inspection_By':{key:"inspectionBy"},
		  'physical_Condition':{key:"physicalCondition"},
		  'gps_Installed':{key:"gpsInstalled",type:"boolean"},
		  'gps_Device_No':{key:"gpsDeviceNo"},
		  'yearOfManufacturing':{key:"agencyYearOfManufacturing"},
		  'engineNo':{key:"agencyEngineNo"},
		  'serialNo':{key:"agencySerialNo"},
		  'chasisNo':{key:"agencyChassisNo"},
		  'registrationNo':{key:"agencyRegistrationNo"},
		  'overallGeneralCondition':{key:"overallGeneralCondition"},
		  'report_url':{key:"valuationReport",type:"file",required:true},
		  'general_image_url':{key:"generalImage",type:"file"},
		  'engine_image_url':{key:"engineImage",type:"file"},
		  'hydraulic_image_url':{key:"hydraulicImage",type:"file"},
		  'cabin_image_url':{key:"cabinImage",type:"file"},
		  'under_carriage_tyre_image_url':{key:"underCarriageImage",type:"file"},
		  'other_image_url':{key:"otherImage",type:"file"}
	},
	'SUBMITTED_TO_AGENCY_FIELD':{
	  'uniqueControlNo' : 'requestId',
      'jobId':'jobId',
      'requestType':'requestType',
      'purpose' : 'purpose',
      'agencyName' : 'valuationAgency.name',
      'enterprise':'enterprise',
      'enterpriseId':'enterprise',
      'customerPartyNo' : 'user.mobile',
      'customerPartyName' : 'customerName',
      'userName' : 'customerName',
      'requestDate' : 'updatedAt',
      'assetId':'product.assetId',
      'assetCategory':'assetCategory',
      'valuerGroupId':'valuerGroupId',
      'assetDescription' : 'product.description',
      'engineNo':'product.engineNo',
      'chassisNo' :'product.chassisNo',
      'registrationNo' :'product.registrationNo',
      'serialNo':'product.serialNumber',
      'yearOfManufacturing' :'product.mfgYear',
      'category':'product.category',
      'brand':'product.brand',
      'model':'product.model',
      'yardParked':'yardParked',
      'country':'product.country',
      'state':'product.state',
      'city':'product.city',
      'contactPerson':'contactPerson',
      'contactPersonTelNo':'contactNumber',
      'invoiceDate':'customerInvoiceDate'
	}
}