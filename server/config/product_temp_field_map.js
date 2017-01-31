'use strict';

module.exports = {
	'Asset_ID*' : 'assetId',
	'Category*' : 'category',
	'Other_Category*' : 'other_category',  //if present then populate otherName and make name to Other
	'Product_Brand*' : 'brand',
	'Other_Brand*' : 'other_brand', //if present then populate otherName and make name to Other
	'Product_Model*' : 'model',
	'Other_Model*' : 'other_model', //if present then populate otherName and make name to Other
	Sub_Category: 'sub_category',
	Variant: 'variant',
	'Trade_Type*' : 'tradeType',
	'Manufacturing_Year*' : 'mfgYear', //could not update
	'Price_on_Request*' : 'priceOnRequest',
	'Currency*' : 'currencyType',
	'Gross_Price*' : 'grossPrice',
	'Country*' : 'country',
	'State*' : 'state',
	'Location*' : 'city',
	//seller information start  need to check from user
	'Seller_Mobile*' : 'seller_mobile',
	'Seller_Email_Address*' : 'seller_email',
	//seller information start  end
	Motor_Operating_Hours: 'motoroperatingHour',
	Mileage: 'mileage',
	Machine_Serial_No: 'serialNo',
	Product_Condition: 'productCondition',
	//technical information column start
	Gross_Weight: 'grossWeight',
	Operating_Weight: 'operatingWeight',
	Bucket_Capacity: 'bucketCapacity',
	Engine_Power: 'enginePower',
	Lifting_Capacity: 'liftingCapacity',
	//technical information column end
	//serviceInfo column starts
	Service_Date: 'servicedate',
	Operating_Hours: 'operatingHour',
	Service_at_KMs: 'serviceAt',
	Authorized_Station: 'authServiceStation',
	//service info column end
	Engine_Repaired_Overhauling: 'isEngineRepaired',
	Comments: 'comment',
	Featured: 'featured',
	//only when trade type is rent or both start
	Availability_of_Asset_From: 'fromDate', 
	Availability_of_Asset_To: 'toDate',
	Rent_Hours: 'rateHours',
	Rent_Days: 'ratedays',
	Rent_Months: 'rateMonths',
	Min_Rental_Period_Hours: 'minPeriodH',
	Max_Rental_Period_Hours: 'maxPeriodH',
	Rent_Amount_Hours: 'rentAmountH',
	Security_Deposit_Hours: 'seqDepositH',
	Min_Rental_Period_Days: 'minPeriodD',
	Max_Rental_Period_Days: 'maxPeriodD',
	Rent_Amount_Days: 'rentAmountD',
	Security_Deposit_Days: 'seqDepositD',
	Min_Rental_Period_Months: 'minPeriodM',
	Max_Rental_Period_Months: 'maxPeriodM',
	Rent_Amount_Months: 'rentAmountM',
	Security_Deposit_Months: 'seqDepositM',
	////only when trade type is rent or both end
	'Rate_My_Equipment':'rateMyEquipment'
}