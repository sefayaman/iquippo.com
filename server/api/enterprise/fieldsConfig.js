'use strict';

module.exports = {
	'ENTERPRISE': {
		'UPLOAD': {
			'Request_Type*': 'requestType',
			'Purpose*': 'purpose',
			'Agency_Name*': 'agencyName',
			'Enterprise*': 'enterpriseName',
			'Customer_Transaction_ID': 'customerTransactionId',
			'Customer_Valuation_No': 'customerValuationNo',
			'Customer_Party_No': 'customerPartyNo',
			'Customer_Party_Name': 'customerPartyName',
			'User': 'user',
			'Request_Date': 'requestDate',
			'Asset_No': 'assetId',
			'Repo_Date': 'repoDate',
			'Asset_Type/Category*': 'category',
			'Make/Brand*': 'brand',
			'Model*': 'model',
			'Asset_Description': 'assetDescription',
			'Engine_No': 'engineNo',
			'Chassis_No': 'chassisNo',
			'Registration_No': 'registrationNo',
			'Invoice_Date': 'invoiceDate',
			'Yard_Parked': 'yardParked',
			'Country*': 'country',
			'State*': 'state',
			'Location*': 'city',
			'Contact_Person': 'contactPerson',
			'Contact_Person_Tel_No': 'contactPersonTelNo',
			'Distance_from_Customer_Office': 'disFromCustomerOffice'
		},
		'MODIFY': {
			'Unique_Control_No*': 'uniqueControlNo',
			'Request_Type*': 'requestType',
			'Purpose*': 'purpose',
			'Agency_Name*': 'agencyName',
			'Enterprise*': 'enterpriseName',
			'Customer_Transaction_ID': 'customerTransactionId',
			'Customer_Valuation_No': 'customerValuationNo',
			'Customer_Party_No': 'customerPartyNo',
			'Customer_Party_Name': 'customerPartyName',
			'User': 'user',
			'Request_Date': 'requestDate',
			'Asset_No': 'assetId',
			'Repo_Date': 'repoDate',
			'Asset_Type/Category*': 'category',
			'Make/Brand*': 'brand',
			'Model*': 'model',
			'Asset_Description': 'assetDescription',
			'Engine_No': 'engineNo',
			'Chassis_No': 'chassisNo',
			'Registration_No': 'registrationNo',
			'Invoice_Date': 'invoiceDate',
			'Yard_Parked': 'yardParked',
			'Country*': 'country',
			'State*': 'state',
			'Location*': 'city',
			'Contact_Person': 'contactPerson',
			'Contact_Person_Tel_No': 'contactPersonTelNo',
			'Distance_from_Customer_Office': 'disFromCustomerOffice'
		},
		'EXPORT': {
			'TRANSACTION': {},
			'INVOICE': {}
		}
	},
	'VALUATION_PARTNER': {
		'MODIFY': {
			'Unique_Control_No*': 'uniqueControlNo',
			'Report_Date': 'reportDate',
			'Report_No': 'reportNo',
			'Year_of_Manufacture': 'yearOfManufacturing',
			'HMR/KMR': 'hmr_kmr',
			'Assessed_Value': 'assessedValue',
			'Inspection_By': 'inspectionBy',
			'Physical_Condition': 'physicalCondition',
			'GPS_Installed': 'gpsInstalled',
			'GPS_Device_No': 'gpsDeviceNo',
			'IMIE_No': 'gpsIMEINo'
		}
	},
	'ASSETGROUP' : {
		'Valuer_Group_ID' : 'valuerGroupId' ,
		'Valuer_Asset_ID' : 'valuerAssetId' ,
		'Valuer_Name' : 'valuerName',
		'Valuer_Code'  : 'valuerCode',
		'ASSET_CATEGORY' : 'assetCategory',
		'Enterprise_Name' : 'enterpriseName',
		'Enterprise_ID': 'enterpriseId'
	}
}