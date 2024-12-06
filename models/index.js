const User = require('./User');
const RoleChangeRequest = require('./RoleChangeRequest');

User.hasMany(RoleChangeRequest, { foreignKey: 'user_id', as: 'roleChangeRequests' });
RoleChangeRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { User, RoleChangeRequest };
