'use strict';

module.exports = {
	'REVERS_MAPPING':{
		'requestType' : 'Request_Type',
		'purpose' : 'Purpose',
		'partnerId' : 'Agency_Unique_Id',
		'enterpriseId' : 'Enterprise_Unique_Id',
		'customerTransactionId' : 'Referance_FI_Number',
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
		'reportUrl' : 'Report_URL'

	},
	'ENTERPRISE': {
		'UPLOAD': {
			'Request_Type*': 'requestType',
			'Purpose*': 'purpose',
			'Agency_Unique_Id*': 'partnerId',
			'Enterprise_Unique_Id*': 'enterpriseId',
			'Referance_FI_Number': 'customerTransactionId',
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
			'Customer_Seeking_Finance':'nameOfCustomerSeeking'
		},
		'MODIFY': {
			'Unique_Control_No*': 'uniqueControlNo',
			'Request_Type': 'requestType',
			'Purpose': 'purpose',
			'Agency_Unique_Id': 'partnerId',
			'Enterprise_Unique_Id': 'enterpriseId',
			'Referance_FI_Number': 'customerTransactionId',
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
			'Customer_Seeking_Finance':'nameOfCustomerSeeking'
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
		"Agency Name":{key:"agency.name"},
		"Enterprise":{key:"enterprise.enterpriseId"},
		"Reference/FI Number":{key:"customerTransactionId"},
		"Customer Party No":{key:"customerPartyNo"},
		"Customer Party Name":{key:"customerPartyName"},
		"User":{key:"userName"},
		"Request Date":{key:"requestDate",type:'date'},
		"Asset No":{key:"assetId"},
		"Repo. Date":{key:"repoDate",type:'date'},
		"Brand/Make":{key:"brand"},
		"Model":{key:"model"},
		"Asset Category":{key:"assetCategory"},
		"Asset Name":{key:"assetDescription"},
		"Engine No":{key:"engineNo"},
		"Chassis No":{key:"chassisNo"},
		"Regn No":{key:"registrationNo"},
		"Invoice Date":{key:"customerInvoiceDate",type:'date'},
		"Invoice Value":{key:"customerInvoiceValue"},
		"Yard Information/Asset Address":{key:"yardParked"},
		"Location":{key:"city"},
		"State":{key:"state"},
		"Country":{key:"country"},
		"Contact Person":{key:"contactPerson"},
		"Contact Person TelNo":{key:"contactPersonTelNo"},
		"Distance From Customer Office":{key:"disFromCustomerOffice"},
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
		"Asset Image General":{key:"generalImage",type:"url"},
		"Asset Image Engine":{key:"engineImage",type:"url"},
		"Asset Image Hydraulic":{key:"hydraulicImage",type:"url"},
		"Asset Image Cabin":{key:"cabinImage",type:"url"},
		"Asset Image Under-Carriage / Tyre":{key:"underCarriageImage",type:"url"},
		"Asset Image Others":{key:"otherImage",type:"url"},
		"Valuation Report":{key:"valuationReport",type:"url"},
		"Invoiced Date":{key:"invoiceDate",allowedRoles:['admin']},
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
		"Cheque Date":{key:"chequeDate"},
		"Cheque Value":{key:"chequeValue"},
		"Deducted TDS":{key:"deductedTds"}
	}
}