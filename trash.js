const { Property } = require("./models");

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
  
 
    static const String calendar = 'calender/all'; get{"uid":'', "property_id":""}
    static const String reviewlist = 'review/all'; get {"orag_id" it means (userid)}
    static const String loginApi = 'users/user/otplogin'; post {"mobile":"45678987"}
    static const String updateProfilePic = 'users/user/pro_image';post  {"image":file}
    static const String faqApi = 'faq/all';
    static const String editProfileApi = 'users/user/update';  post { name, gender, email, uid }
    static const String homeDataApi = 'u_homedata'; get { uid, country_id }
    static const String addAndRemoveFavourite = 'favorites/toggle-favorite'; post { pid, property_type }
    static const String favouriteList = 'favorites/get-favorite-list';  post { property_type, country_id }
    static const String searchApi = 'u_search_property.php';
    static const String catWiseData = '/user/properties/types'; get {ptype}
    static const String allCountry = 'u_country/all';
    static const String dashboardApi = 'u_dashboard/all'; get { uid }
    static const String changeRole = 'users/user/changerole';
    static const String deletAccount = 'users/user/delete'; put {uid}
    static const String couponCheck = 'coupon/applyCoupon'; post {uid, cid}
    static const String propertyDetails = '/user/properties/u_property_details';(post- pro_id,uid)
    static const String checDateApi = '/check-availability/check-availability';(post- pro_id, check_in, check_out)
    static const String bookApi = '/user/bookings/book';(post)
    static const String statusWiseBook = '/user/bookings/status';(post- uid, status)
    static const String bookingCancle = '/user/bookings/booking-cancel';(post- uid,book_id,cancel_reason)
    static const String bookingDetails = '/user/bookings/booking-details';(post- uid,book_id)
    static const String propertyList = '/user/properties/list?uid=1';(get)
    static const String addPropertyApi = '/user/properties/add';(post)
    static const String extraImageList = '/u_extralist/extra-images';(post- uid)
    static const String addExtraImage = 'u_extralist/add-extra';(post)
    static const String editExtraImage = '/u_extralist/update/:extra_id';(put)
    static const String propertyType = '/user/properties/types';(get- ptype)
    static const String proBookStatusWise = '/user/bookings/getMyUserBooking';(post- uid, status)
    static const String proBookingDetails = '/user/bookings/getMyUserBookingDetails';(post- book_id,uid)
    static const String proBookingCancle = '/user/bookings/myUserCancelBookings';(post- uid,book_id,cancel_reason)
    static const String proCheckIN = '/check-availability/check-in';(post- uid, book_id)
    static const String proCheckOutConfirmed = '/check-availability/check-out';(post- uid, book_id)
    

  }