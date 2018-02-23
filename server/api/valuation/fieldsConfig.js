'use strict';

module.exports = {
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