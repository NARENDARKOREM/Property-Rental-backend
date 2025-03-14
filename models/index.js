const User = require("./User");
const RoleChangeRequest = require("./RoleChangeRequest");
const TblCategory = require("./TblCategory");
const Property = require("./Property");
const TblCountry = require("./TblCountry");
const TblExtra = require("./TblExtra");
const TblExtraImage = require("./TableExtraImages");
const TblFacility = require("./TblFacility");
const TblBook = require("./TblBook");
const TblFav = require("./TblFav");
const Setting = require("./Setting");
const PriceCalendar = require("./PriceCalendar");
const PersonRecord = require("./PersonRecord");
const TravelerHostReview = require("./TravelerHostReview");
const HostTravelerReview = require("./HostTravelerReview");
const TblCity = require("./TblCity");
const PropertyBlock = require("./PropertyBlock");

RoleChangeRequest.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(RoleChangeRequest, {
  foreignKey: "user_id",
  as: "roleChangeRequests",
});

Property.belongsTo(TblCategory, { as: "category", foreignKey: "ptype" });
TblCategory.hasMany(Property, { as: "properties", foreignKey: "ptype" });

Property.belongsTo(TblCountry, { as: "country", foreignKey: "country_id" });
TblCountry.hasMany(Property, { as: "properties", foreignKey: "country_id" });

// Property.belongsTo(TblFacility, { as: "facilities", foreignKey: "facility" });
// TblFacility.hasMany(Property, { as: "properties", foreignKey: "facility" });

TblExtra.belongsTo(Property, { as: "properties", foreignKey: "pid" });
Property.hasMany(TblExtra, { as: "extraImg", foreignKey: "pid" });

TblExtra.hasMany(TblExtraImage, { foreignKey: "extra_id", as: "images" });
TblExtraImage.belongsTo(TblExtra, { foreignKey: "extra_id" });

TblBook.belongsTo(Property, { as: "properties", foreignKey: "prop_id" });
Property.hasMany(TblBook, { foreignKey: "prop_id", as: "properties" });

TblFav.belongsTo(Property, { foreignKey: "property_id", as: "property" });
Property.hasMany(TblFav, { foreignKey: "property_id" });

Property.belongsTo(Setting, { as: "setting", foreignKey: "setting_id" });
Setting.hasMany(Property, { foreignKey: "setting_id" });

TblBook.belongsTo(User, { foreignKey: "uid", as: "travler_details" });
User.hasMany(TblBook, { foreignKey: "uid", as: "travler_details", onDelete: "CASCADE"});
TblBook.belongsTo(User, { foreignKey: "add_user_id", as: "hostDetails" }); // Host


PriceCalendar.belongsTo(Property, { foreignKey: "prop_id", as: "property" });
Property.hasMany(PriceCalendar, {
  foreignKey: "prop_id",
  as: "priceCalendars",
});

PersonRecord.belongsTo(TblBook, {
  foreignKey: "book_id",
  as: "travelerDetails",
});
TblBook.hasMany(PersonRecord, { foreignKey: "book_id", as: "travelerDetails" });

Property.belongsTo(User, { foreignKey: "add_user_id", as: "Owner" });
User.hasMany(Property, { foreignKey: "add_user_id", as: "properties", onDelete: "CASCADE"});

// Reviews
TravelerHostReview.belongsTo(User, {
  foreignKey: "traveler_id",
  as: "traveler",
});
User.hasMany(TravelerHostReview, {
  foreignKey: "traveler_id",
  as: "travelerReviews",
});

HostTravelerReview.belongsTo(User, {
  foreignKey: "traveler_id",
  as: "traveler",
});
User.hasMany(HostTravelerReview, {
  foreignKey: "traveler_id",
  as: "hostReviews",
});

HostTravelerReview.belongsTo(User, { foreignKey: "host_id", as: "host" });
User.hasMany(HostTravelerReview, {
  foreignKey: "host_id",
  as: "hostedReviews",
});

TblCity.belongsTo(TblCountry, {
  foreignKey: "country_id",
  as: "country",
  onDelete: "CASCADE",
});
TblCountry.hasMany(TblCity, {
  foreignKey: "country_id",
  as: "cityList",
  onDelete: "CASCADE",
});

// TblCity.belongsTo(TblCountry,{foreignKey:"country_id",as:"country"});
// TblCountry.hasMany(TblCity,{foreignKey:"country_id"});

Property.belongsTo(TblCity, { foreignKey: "city", as: "cities" });
TblCity.hasMany(Property, { foreignKey: "city", as: "cities" });

User.hasMany(TblFav, { foreignKey: "uid", onDelete: "CASCADE" });
TblFav.belongsTo(User, { foreignKey: "uid" });

// Property.hasMany(PropertyBlock,{foreignKey:'prop_id',as:'blockedDates'})

Property.hasMany(PropertyBlock, { foreignKey: "prop_id", as: "blockedDates" });
PropertyBlock.belongsTo(Property, { foreignKey: "prop_id", as: "property" });


module.exports = {
  User,
  RoleChangeRequest,
  TblCategory,
  Property,
  TblCountry,
  TblExtra,
  Setting,
  PriceCalendar,
};
