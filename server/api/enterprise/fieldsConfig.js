'use strict';

module.exports = {
	'REVERS_MAPPING':{
		'requestType' : 'Request_Type',
		'purpose' : 'Purpose',
		'partnerId' : 'Agency_Unique_Id',
		'enterpriseId' : 'Enterprise_Unique_Id',
		'customerTransactionId' : 'Reference_FI_Number',
		'requestDate' : 'Request_Date',
		'assetId' : 'Asset_No',
		'repoDate' : 'Repo_Date',
		'assetCategory' : 'Asset_Group_Category*',
		'brand' : 'Make/Brand',
		'model' : 'Model',
		'assetDescription' : 'Asset_Name',
		'engineNo' : 'Engine_No',
		'chassisNo' : 'Chassis_No', 
		'serialNo' : 'Serial_No',
		'yearOfManufacturing': 'Year_of_Manufacture',
		'registrationNo' : 'Registration_No',
		'yardParked' : 'Yard Information/Asset Address',
		'country' : 'Country',
		'state' : 'State',
		'city':'Location',
		'contactPerson' : 'Contact_Person',
		'contactPersonTelNo' : 'Contact_Person_Tel_No',
		'disFromCustomerOffice' : 'Distance_from_Customer_Office',
		'customerInvoiceDate' : 'Invoice Date',
		'customerInvoiceValue' : 'Invoice Value',
		'uniqueControlNo' : 'Unique_Control_No',
		'reportDate' : 'Report_Date',
		'reportNo' : 'Report_No',
		'agencyYearOfManufacturing' : 'Year_of_Manufacture',
		'agencyEngineNo' :'Engine_No',
		'agencyChassisNo' : 'Chassis_No',
		'agencyRegistrationNo' : 'Registration_No',
		'agencySerialNo' : 'Serial_No',
		'hmr_kmr' : 'HMR/KMR',
		'assessedValue': 'Assessed_Value',
		'inspectionBy' : 'Inspection_By',
		'physicalCondition' : 'Physical_Condition',
		'gpsInstalled' : 'GPS_Installed',
		'gpsDeviceNo' : 'GPS_Device_No',
		'gpsIMEINo' : 'IMIE_No',
		'reportUrl' : 'Report_URL',
		'originalOwner':'Original_Owner'

	},
	'REPORT_UPLOAD' :{
		  'jobID':{key:"jobId",required:true},
		  'unique_controll_no':{key:"uniqueControlNo",required:true},
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
	'PUT_ON_HOLD':{
		'jobID':{key:"jobId",required:true},
		'unique_controll_no':{key:"uniqueControlNo",required:true},
		'message':{key:"onHoldMsg",required:true},
	},
	'STATUS_UPDATE':{
		'jobID':{key:"jobId",required:true},
		'unique_controll_no':{key:"uniqueControlNo",required:true},
		'status':{key:"status",required:true},
	},
	 'SUBMITTED_TO_AGENCY_FIELD':{
	 		'uniqueControlNo' : 'uniqueControlNo',
	 		'jobId':'jobId',
		    'requestType':'requestType',
		    'purpose' : 'purpose',
		    'agencyName' : 'agency.name',
		    'enterprise':'enterprise.name',
		    'enterpriseId':'enterprise.enterpriseId',
		    'customerTransactionId' : 'customerTransactionId',
		    'customerValuationNo' : 'customerValuationNo',
		    'customerPartyNo' : 'customerPartyNo',
		    'customerPartyName' : 'customerPartyName',
		    'userName' : 'userName',
		    'requestDate' : 'requestDate',
		    'assetId':'assetId',
		    'repoDate' : 'repoDate',
		    'assetCategory':'assetCategory',
		    'valuerGroupId':'valuerGroupId',
		    'valuerAssetId':'valuerAssetId',
		    'assetDescription' : 'assetDescription',
		    'engineNo':'engineNo',
		    'chassisNo' :'chassisNo',
		    'registrationNo' :'registrationNo',
		    'serialNo':'serialNo',
		    'yearOfManufacturing' :'yearOfManufacturing',
		    'category':'category',
		    'brand':'brand',
		    'model':'model',
		    'yardParked':'yardParked',
		    'country':'country',
		    'state':'state',
		    'city':'city',
		    'contactPerson':'contactPerson',
		    'contactPersonTelNo':'contactPersonTelNo',
		    'disFromCustomerOffice':'disFromCustomerOffice',
		    'customerSeekingFinance':'nameOfCustomerSeeking',
		    'invoiceDate':'customerInvoiceDate',
		    'invoiceValue':'customerInvoiceValue',
		    'originalOwner':'originalOwner',
		    'requestModifiedMsg':'requestModifiedMsg',
		    'fieldsModified' : 'fieldsModified'
	 },
	'ENTERPRISE': {
		'UPLOAD': {
			'Request_Type*': 'requestType',
			'Purpose*': 'purpose',
			'Agency_Unique_Id*': 'partnerId',
			'Enterprise_Unique_Id*': 'enterpriseId',
			'Reference_FI_Number': 'customerTransactionId',
			'Request_Date': 'requestDate',
			'Asset_No': 'assetId',
			'Repo_Date': 'repoDate',
			'Asset_Group_Category*': 'assetCategory',
			'Make/Brand': 'brand',
			'Model': 'model',
			'Asset_Name*': 'assetDescription',
			'Engine_No': 'engineNo',
			'Chassis_No': 'chassisNo',
			'Serial_No': 'serialNo',
			"Year_of_Manufacture":"yearOfManufacturing",
			'Registration_No': 'registrationNo',
			'Yard Information/Asset Address*': 'yardParked',
			'Country*': 'country',
			'State*': 'state',
			'Location*': 'city',
			'Contact_Person*': 'contactPerson',
			'Contact_Person_Tel_No*': 'contactPersonTelNo',
			'Distance_from_Customer_Office': 'disFromCustomerOffice',
			'Invoice Date':'customerInvoiceDate',
			'Invoice Value':'customerInvoiceValue',
			'Customer_Seeking_Finance':'nameOfCustomerSeeking',
			'Original_Owner' : 'originalOwner'
		},
		'MODIFY': {
			'Unique_Control_No*': 'uniqueControlNo',
			'Request_Type': 'requestType',
			'Purpose': 'purpose',
			'Agency_Unique_Id': 'partnerId',
			'Enterprise_Unique_Id': 'enterpriseId',
			'Reference_FI_Number': 'customerTransactionId',
			'Request_Date': 'requestDate',
			'Asset_No': 'assetId',
			'Repo_Date': 'repoDate',
			'Asset_Group_Category': 'assetCategory',
			'Make/Brand': 'brand',
			'Model': 'model',
			'Asset_Name': 'assetDescription',
			'Engine_No': 'engineNo',
			'Chassis_No': 'chassisNo',
			'Serial_No': 'serialNo',
			"Year_of_Manufacture":"yearOfManufacturing",
			'Registration_No': 'registrationNo',
			'Yard Information/Asset Address': 'yardParked',
			'Country': 'country',
			'State': 'state',
			'Location': 'city',
			'Contact_Person': 'contactPerson',
			'Contact_Person_Tel_No': 'contactPersonTelNo',
			'Distance_from_Customer_Office': 'disFromCustomerOffice',
			'Invoice Date':'customerInvoiceDate',
			'Invoice Value':'customerInvoiceValue',
			'Customer_Seeking_Finance':'nameOfCustomerSeeking',
			'Original_Owner' : 'originalOwner'
		},
		'EXPORT': {
			'TRANSACTION': {},
			'INVOICE': {}
		}
	},
	'VALUATION_PARTNER': {
		'MODIFY': {
			'Unique_Control_No*': 'uniqueControlNo',
			'Report_Date*': 'reportDate',
			'Report_No*': 'reportNo',
			'Year_of_Manufacture*': 'agencyYearOfManufacturing',
			'Engine_No':'agencyEngineNo',
			'Chassis_No':'agencyChassisNo',
			'Registration_No':'agencyRegistrationNo',
			'Serial_No':'agencySerialNo',
			'HMR/KMR*': 'hmr_kmr',
			'Assessed_Value*': 'assessedValue',
			'Inspection_By*': 'inspectionBy',
			'Physical_Condition*': 'physicalCondition',
			'GPS_Installed': 'gpsInstalled',
			'GPS_Device_No': 'gpsDeviceNo',
			'IMIE_No': 'gpsIMEINo',
			'Report_URL*':'reportUrl'

		}
	},
	'ASSETGROUP' : {
		'Valuer_Group_ID' : 'valuerGroupId',
		'Valuer_Asset_ID' : 'valuerAssetId' ,
		'Valuer_Name' : 'valuerName',
		'Valuer_Code'  : 'valuerCode',
		'ASSET_CATEGORY' : 'assetCategory',
		'Enterprise_Name' : 'enterpriseName',
		'Enterprise_ID': 'enterpriseId'
	},
	'TRANSACTION_EXPORT':{
		"Unique Control Number":{key:"uniqueControlNo"},
		"Status":{key:"status"},
		"Request Type":{key:"requestType"},
		"Purpose":{key:"purpose"},
		"Customer Seeking Finance":{key:"nameOfCustomerSeeking"},
		'Original Owner' : {key:"originalOwner"},
		"Agency Name":{key:"agency.name"},
		"Enterprise ID":{key:"enterprise.enterpriseId"},
		"Enterprise Owner":{key:"customerPartyName"},
        "User Customer ID":{key:"createdBy.userCustomerId"},
		"User":{key:"userName"},
		"User Mobile":{key:"customerPartyNo"},
		"User Legal Entity":{key:"legalEntityName"},
		"Request Date":{key:"requestDate",type:'date'},
		"Request Date With time":{key:"requestDate",type:'datetime'},
		"Referance/FI Number":{key:"customerTransactionId"},
		"Asset No":{key:"assetId"},
		"Repo. Date":{key:"repoDate",type:'date'},
		"Brand/Make":{key:"brand"},
		"Model":{key:"model"},
		"Asset Category":{key:"assetCategory"},
		"Asset Name":{key:"assetDescription"},
		"Engine No":{key:"engineNo"},
		"Chassis No":{key:"chassisNo"},
		"Serial No":{key:"serialNo"},
		"Regn No":{key:"registrationNo"},
		"Invoice Date":{key:"customerInvoiceDate",type:'date'},
		"Invoice Value":{key:"customerInvoiceValue"},
		"Yard Information/Asset Address":{key:"yardParked"},
		"Location":{key:"city"},
		"State":{key:"state"},
		"Country":{key:"country"},
		"Contact Person":{key:"contactPerson"},
		"Contact Person Tel No":{key:"contactPersonTelNo"},
		"Distance From Customer Office":{key:"disFromCustomerOffice"},
		"Request Submitted Agency Date":{key:"submittedToAgencyDate",type:'date'},
		"Report No":{key:"reportNo"},
		"Report Date":{key:"reportDate",type:'date'},
		"Year of Manufacture":{key:"yearOfManufacturing"},
		"HMR / KMR":{key:"hmr_kmr"},
		"Assessed Value":{key:"assessedValue"},
		"Inspection By":{key:"inspectionBy"},
		"Physical Condition":{key:"physicalCondition"},
		"GPS Installed":{key:"gpsInstalled",type:"boolean"},
		"IMIE No":{key:"gpsIMEINo"},
		"GPS Device No":{key:"gpsDeviceNo"},
		"Engine Number by Quippo":{key:"agencyEngineNo"},
		"Chassis Number by Quippo":{key:"agencyChassisNo"},
		"Registration Number by Quippo":{key:"agencyRegistrationNo"},
		"Serial Number by Quippo":{key:"agencySerialNo"},
		"Asset Image General":{key:"generalImage",type:"url"},
		"Asset Image Engine":{key:"engineImage",type:"url"},
		"Asset Image Hydraulic":{key:"hydraulicImage",type:"url"},
		"Asset Image Cabin":{key:"cabinImage",type:"url"},
		"Asset Image Under-Carriage / Tyre":{key:"underCarriageImage",type:"url"},
		"Asset Image Others":{key:"otherImage",type:"url"},
		"Valuation Report":{key:"valuationReport",type:"url"},
		"Overall General Condition":{key:"overallGeneralCondition"},
		"Invoiced Date":{key:"invoiceDate",allowedRoles:['admin'],type:"date"},
		"Invoice No":{key:"invoiceNo",allowedRoles:['admin']},
		"Payment Received":{key:"paymentReceived",type:"boolean",allowedRoles:['admin']},
		"Payment Made to Agency":{key:"paymentMade",type:"boolean",allowedRoles:['admin']}
	},
	'INVOICE_EXPORT':{
		"Unique Invoice Number":{key:"invoiceNo"},
		"Payment Type":{key:"paymentType",allowedRoles:['admin']},
		"Request Type":{key:"requestType"},
		"Enterprise Id":{key : "enterprise.enterpriseId"},
		"Enterprise Name":{key : "enterprise.name"},
		"Enterprise Contact No":{key:"enterprise.mobile"},
		"Valuation Partner Name":{key:"agency.name"},
		"Valuation Partner Contact No":{key:"agency.mobile"},
		"Invoice Amount":{key:"totalAmount"},
		"Payment Received":{key:"paymentReceived",allowedRoles:['admin']},
		"Payment Made":{key:"paymentMade",allowedRoles:['admin']},
		"Invoice Date":{key:"createdAt",type:'date'},
		"Bank Name":{key:"bankName",allowedRoles:['admin']},
		"Branch Name":{key:"branchName",allowedRoles:['admin']},
		"Cheque No":{key:"chequeNo",allowedRoles:['admin']},
		"Cheque Date":{key:"chequeDate",allowedRoles:['admin']},
		"Cheque Value":{key:"chequeValue",allowedRoles:['admin']},
		"Deducted TDS":{key:"deductedTds",allowedRoles:['admin']}
		
	},
	'EXPORT_PAYMENT':{
		"Unique Invoice Number":{key:"invoiceNo"},
		"Request Type":{key:"requestType"},
		"Enterprise Id":{key:"enterpriseId"},
		"Enterprise Name":{key:"enterpriseName"},
		"Enterprise Contact No":{key:"enterpriseContactNo"},
		"Valuation Partner Name":{key:"valuationPartnerName"},
		"Valuation Partner Contact No":{key:"valuationPartnerContactNo"},
		"Bank Name":{key:"bankName"},
		"Branch Name":{key:"branchName"},
		"Cheque No":{key:"chequeNo"},
		"Cheque Date":{key:"chequeDate",type:'date'},
		"Cheque Value":{key:"chequeValue"},
		"Deducted TDS":{key:"deductedTds"}
	},
	'Report_Field_MAP' : {
	    "GPSID": "gpsDeviceNo",
	    "VALUATION_NO":"uniqueControlNo",
	    "ASSET_DETAILS" : "assetDetails",
	    "YEAROFMFG" : "agencyYearOfManufacturing",
	    "ENGINENO":"agencyEngineNo",
	    "CHASISNO":"agencyChassisNo",
	    "REGISTRATION_NO" : "agencyRegistrationNo",
	    "SERIAL_NO" : "agencySerialNo",
	    "INSERT_DATETIME":"INSERT_DATETIME",
	    "BOOKED":"BOOKED",
	    "NG_CONTRACT_NO":"NG_CONTRACT_NO",
	    "ASSET_ID":"ASSET_ID"
  }
}