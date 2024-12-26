class Config {


    static const String baseurl = 'https://prop-rent.innoitcrm.com/';
    static const String baseurl1 = 'https://property-rental-backend-5.onrender.com/';
    static const String baseurl2 = 'https://property-rental-backend-ten.vercel.app/';
  
    static  String? firebaseKey ;
  
    static String? projectID = "rental-property-45da3";
  
    static const String path = baseurl + 'user_api/';
  
    static const String oneSignel = "dbec0354-d32f-4287-a15f-e520279eec40";
  
    static const googleKey = "AIzaSyCtwQS1XF0mY8fiLtz_OolVzJvF6Pciorw";
  
    static const String imageUrl = baseurl;
  
    static const paymentBaseUrl = baseurl;
  
    static const String smstype = 'sms_type.php';
    static const String paystackpayment = 'paystack/index.php';
    // static const String calendar = 'calendar.php'; *** Done
   

    static const String reviewlist = '/review/all';*** Done 
    {
      "orag_id":4
    }

    static const String msgotp = 'msg_otp.php';
    static const String twillotp = 'twilio_otp.php';
    // static const String registerUser = 'u_reg_user.php';

    static const String mobileChack = 'mobile_check.php';
    // static const String loginApi = 'u_login_user.php';

    // static const String paymentgatewayApi = 'u_paymentgateway.php';
    // static const String pageListApi = 'u_pagelist.php';
    // static const String couponlist = 'u_couponlist.php';** Done 
    // static const String couponCheck = 'u_check_coupon.php';** Done 
    // static const String forgetPassword = 'u_forget_password.php';
    // static const String updateProfilePic = 'pro_image.php';

    // static const String faqApi = 'u_faq.php';*** Done 
    // static const String editProfileApi = 'u_profile_edit.php';
    // static const String walletReportApi = 'u_wallet_report.php';
    // static const String walletUpdateApi = 'u_wallet_up.php';
    // static const String referDataGetApi = 'u_getdata.php';
    static const String homeDataApi = '/u_homedata';***
    {
      "country_id":1,
      "uid":1
    }

    // static const String addAndRemoveFavourite = 'u_fav.php';

    // static const String favouriteList = 'u_favlist.php';

    static const String propertyDetails = '/user/properties/u_property_details';(post- pro_id,uid)
    static const String searchApi = '/user/properties/search?location=Hyderabad&check_in=2025-01-01&check_out=2025-01-05';(get- params)
    static const String checDateApi = '/check-availability/check-availability';(post- pro_id, check_in, check_out)
    static const String bookApi = '/user/bookings/book';(post)
    static const String statusWiseBook = '/user/bookings/status';(post- uid, status)
    static const String bookingCancle = '/user/bookings/booking-cancel';(post- uid,book_id,cancel_reason)
    static const String bookingDetails = '/user/bookings/booking-details';(post- uid,book_id)
    // static const String reviewApi = 'u_rate_update.php';
    // static const String catWiseData = 'u_cat_wise_property.php';
    static const String notification = 'notification.php';
    // static const String enquiry = 'u_enquiry.php';
    // static const String seeAllGalery = 'view_gallery.php';
    // static const String allCountry = 'u_country.php';

    static const String deletAccount = 'acc_delete.php';***

    // static const String subScribeList = 'u_package.php';
    // static const String packagePurchase = 'u_package_purchase.php';

    // static const String dashboardApi = 'u_dashboard.php';
    static const String propertyList = '/user/properties/list?uid=1';(get)
    static const String addPropertyApi = '/user/properties/add';(post)
    static const String editPropertyApi = '/user/properties/edit';(post)

    static const String extraImageList = '/u_extralist/extra-images';(post- uid)
    static const String addExtraImage = 'u_extralist/add-extra';(post)
    static const String editExtraImage = '/u_extralist/update/:extra_id';(put)
    static const String propertyType = '/user/properties/types';(get- ptype)
    // static const String facilityList = 'u_facility.php';


    // static const String galleryCatList = 'u_gallery_cat_list.php';
    // static const String addGalleryCat = 'u_gal_cat_add.php';
    // static const String upDateGalleryCat = 'u_gal_cat_edit.php';
    // static const String galleryList = 'gallery_list.php';
    // static const String addGallery = 'add_gallery.php';
    // static const String editGallery = 'update_gallery.php';
    // static const String proWiseGalleryCat = 'property_wise_galcat.php';
    // static const String subScribeDetails = 'u_sub_details.php';
  
    static const String proBookStatusWise = '/user/bookings/getMyUserBooking';(post- uid, status)
    static const String proBookingDetails = '/user/bookings/getMyUserBookingDetails';(post- book_id,uid)
    static const String proBookingCancle = '/user/bookings/myUserCancelBookings';(post- uid,book_id,cancel_reason)
    // static const String confirmedBooking = 'u_confim.php';
    static const String proCheckIN = '/check-availability/check-in';(post- uid, book_id)
    static const String proCheckOutConfirmed = '/check-availability/check-out';(post- uid, book_id)
  
    // static const String makeSellProperty = 'u_sale_prop.php';
    // static const String enquiryListApi = 'u_my_enquiry.php';
  
    // static const String requestWithdraw = 'request_withdraw.php';
    // static const String payOutList = 'payout_list.php';
  
    static const String changeRole = 'users/user/changerole';
  }



  
//   in coupon 
// =========
// -> in coupon list page expiredDate sorting not working
// -> using swagger coupon delete both (soft  and forceDelete) not working.
// ->in coupon table expiredDate showing date with time instead of date only

// in facility
// ===========
// -> search api not working

// in settings
// ===========
// -> setting update is not working
// -> setting create not tested

// in property
// ==========
// -> in property  page showing datetime
// -> property delete not working
// -> property adding not worked

// in extra images
// ===============
// -> create and update extra image not working
// -> extra-image toggle status not working

// in bookings
// ==========
// -> booking count is not working and shown wrong msg
// -> http://localhost:5000/bookings/myBookings/all (pending)



// in user api
// =============
// check-availability/check-availability (worked)
// faq/all (worked)
// coupon/applyCoupon (worked)
// coupon/all (worked)
// u_facility/all (worked)
// u_country/all(worked)
// user/properties/all-properties(worked)
// user/properties/list (worked)



// review/all(============> not worked)
// calender/all(===========> not worked)
// u_extralist/extra-images/{uid}(===========> pending)
// u_extralist/upsert(===========> not tested)
// properties/u_property_details(=========> not worked)
// user/properties/search(=========> not worked)
// user/properties/types(=========> pending)
// user/properties/edit(=========> pending)