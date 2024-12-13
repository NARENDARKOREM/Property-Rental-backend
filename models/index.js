const User = require("./User");
const RoleChangeRequest = require("./RoleChangeRequest");
const TblCategory = require("./TblCategory");
const Property = require("./Property");
const TblCountry = require("./TblCountry");
const TblExtra = require("./TblExtra");

User.hasMany(RoleChangeRequest, {
  foreignKey: "user_id",
  as: "roleChangeRequests",
});
RoleChangeRequest.belongsTo(User, { foreignKey: "user_id", as: "user" });

Property.belongsTo(TblCategory, { as: "category", foreignKey: "ptype" });
TblCategory.hasMany(Property, { as: "properties", foreignKey: "ptype" });

Property.belongsTo(TblCountry, { as: "country", foreignKey: "country_id" });
TblCountry.hasMany(Property, { as: "properties", foreignKey: "country_id" });

TblExtra.belongsTo(Property, { as: "properties", foreignKey: "pid" });
Property.hasMany(TblExtra, { as: "extraImg", foreignKey: "pid" });

module.exports = {
  User,
  RoleChangeRequest,
  TblCategory,
  Property,
  TblCountry,
  TblExtra,
};
