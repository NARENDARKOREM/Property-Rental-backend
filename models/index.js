const User = require("./User");
const RoleChangeRequest = require("./RoleChangeRequest");
const TblCategory = require("./TblCategory");
const Property = require("./Property");
const TblCountry = require("./TblCountry");
const TblExtra = require("./TblExtra");
const TblExtraImage = require("./TableExtraImages");
const TblFacility = require("./TblFacility");

RoleChangeRequest.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(RoleChangeRequest, {
  foreignKey: "user_id",
  as: "roleChangeRequests",
});

Property.belongsTo(TblCategory, { as: "category", foreignKey: "ptype" });
TblCategory.hasMany(Property, { as: "properties", foreignKey: "ptype" });

Property.belongsTo(TblCountry, { as: "country", foreignKey: "country_id" });
TblCountry.hasMany(Property, { as: "properties", foreignKey: "country_id" });

Property.belongsTo(TblFacility, { as: "facilities", foreignKey: "facility" });
TblFacility.hasMany(Property, { as: "properties", foreignKey: "facility" });

TblExtra.belongsTo(Property, { as: "properties", foreignKey: "pid" });
Property.hasMany(TblExtra, { as: "extraImg", foreignKey: "pid" });

TblExtra.hasMany(TblExtraImage, { foreignKey: "extra_id", as: "images" });
TblExtraImage.belongsTo(TblExtra, { foreignKey: "extra_id" });

module.exports = {
  User,
  RoleChangeRequest,
  TblCategory,
  Property,
  TblCountry,
  TblExtra,
};
