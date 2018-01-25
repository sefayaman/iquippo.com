'use strict';

module.exports = {
	'Asset_ID*': 'assetId',
	'Category*': 'category',
	'Other_Category*': 'other_category', //if present then populate otherName and make name to Other
	'Brand*': 'brand',
	'Other_Brand*': 'other_brand', //if present then populate otherName and make name to Other
	'Model*': 'model',
	'Other_Model*': 'other_model', //if present then populate otherName and make name to Other
	'Sub_Category': 'sub_category',
	'Engine_No': 'engineNo',
	'Chasis_No': 'chasisNo',
	'Registration_No': 'registrationNo',
	'Variant': 'variant',
        'Product_Group':'group_name', 
        'Product_Name':'name', 
	'Trade_Type(SELL/NOT_AVAILABLE)*': 'tradeType',
	'Manufacturing_Year*': 'mfgYear', //could not update
	'Price_On_Request(Yes/No)*': 'priceOnRequest',
	'Currency*': 'currencyType',
	'Sale_Price*': 'grossPrice',
	'Country*': 'country',
	'State*': 'state',
	'Location*': 'city',
	//seller information start  need to check from user
	'Seller Customer ID': 'seller_customerId',
	'Seller_Mobile*': 'seller_mobile',
	'Seller_Email_Address': 'seller_email',
	'Seller_Name' : 'seller_name',
        'Seller_Role':'seller_role',
	//seller information start  end
	'Motor_Operating_Hours': 'motorOperatingHour',
	'Mileage': 'mileage',
	'Machine_Serial_No': 'serialNo',
	//'Product_Condition': 'productCondition',
	//technical information column start
	'Gross_Weight': 'grossWeight',
	'Operating_Weight': 'operatingWeight',
	'Bucket_Capacity': 'bucketCapacity',
	'Engine_Power': 'enginePower',
	'Lifting_Capacity': 'liftingCapacity',
	//technical information column end
	//serviceInfo column starts
	'Service_Date': 'servicedate',
	'Operating_Hours': 'operatingHour',
	'Service_at_KMs': 'serviceAt',
	'Authorized_Station': 'authServiceStation',
	//service info column end
	'Engine_Repaired_Overhauling': 'isEngineRepaired',
	'Comments': 'comment',
	'Featured': 'featured',
	//only when trade type is rent or both start
	'Availability_of_Asset_From': 'fromDate',
	'Availability_of_Asset_To': 'toDate',
	'Rent_Hours': 'rateHours',
	'Rent_Days': 'ratedays',
	'Rent_Months': 'rateMonths',
	'Min_Rental_Period_Hours': 'minPeriodH',
	'Max_Rental_Period_Hours': 'maxPeriodH',
	'Rent_Amount_Hours': 'rentAmountH',
	'Security_Deposit_Hours': 'seqDepositH',
	'Min_Rental_Period_Days': 'minPeriodD',
	'Max_Rental_Period_Days': 'maxPeriodD',
	'Rent_Amount_Days': 'rentAmountD',
	'Security_Deposit_Days': 'seqDepositD',
	'Min_Rental_Period_Months': 'minPeriodM',
	'Max_Rental_Period_Months': 'maxPeriodM',
	'Rent_Amount_Months': 'rentAmountM',
	'Security_Deposit_Months': 'seqDepositM',
	////only when trade type is rent or both end
	'Rate_Equipment(Average/Good/Excellent)': 'rateMyEquipment',
	'Special_Offers': 'specialOffers',
	'Video_Link': 'videoLinks',

	//only visible to admin
	'Asset_Status(listed/sold)': 'assetStatus',
	'To_be_shown_under_Product_Information(Yes/No)': 'dispSellerInfo',
	'Contact_Number_to_be_displayed_in_front_end(Yes/No)': 'dispSellerContact',
	'Alternate_Contact_Number': 'alternateMobile',
	'Alternate_Contact_Number_To_be_displayed_in_front_end(Yes/No)': 'dispSellerAlternateContact',
	'Featured(Yes/No)': 'featured',
	'Active(Yes/No)': 'status',
	//Auction Related Cols
	'List_for_Auctions(Yes/No)': 'auctionListing',
	'Auction_ID': 'auctionId',
	'EMD_Amount': 'emdAmount',
	'Request_for_Valuation(Yes/No)': 'valuationReq',
	'Name_of_Agency': 'agencyName',
	//Extra Columns Added in next request by Venkat
	'Uploaded_By' : 'uploaded_by',
	'Listing_Date' : 'listing_date',
	//Extra field added for asset sale
	'Parked_Since' : 'repoDate',
	'Valuation_Amount' : 'valuationAmount',
	'Parking_Charge_Payment_To(Yard/Seller)':'parkingPaymentTo',
	'Parking_Charge_Per_Day' : 'parkingChargePerDay',
	'Address_Of_Asset' : 'addressOfAsset',
  'Reserve_Price' : 'reservePrice',
  'Row_Count':'rowCount'
}
