const RoleChangeRequest = require("../models/RoleChangeRequest");
const User = require("../models/User");

exports.getPendingRoleChangeRequests = async (req, res) => {
  try {
    const pendingRequests = await RoleChangeRequest.findAll({
      where: { status: "pending" },
      include: [{ model: User,as: "user",attributes: ['id', 'name', 'email', 'role'] }],
    });
    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch pending requests." });
  }
};

exports.handleRoleChangeRequest = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const request = await RoleChangeRequest.findByPk(id);

    if (!request)
      return res.status(404).json({ message: "Request not found." });

    if (status === "approved") {
      const user = await User.findByPk(request.user_id);
      if (!user) return res.status(404).json({ message: "User not found." });

      user.role = request.requested_role;
      await user.save();
    }

    request.status = status;
    await request.save();

    res.status(200).json({ message: `Request ${status} successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to process the request." });
  }
};

exports.deleteRoleChangeRequest = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;

  try {
    const request = await RoleChangeRequest.findOne({
      where: { id },
      paranoid: false,
    });
    if (!request) {
      return res.status(404).json({ error: "Role change request not found" });
    }

    if (request.deletedAt && forceDelete !== "true") {
      return res
        .status(400)
        .json({ error: "Role change request is already soft-deleted" });
    }

    if (forceDelete === "true") {
      await request.destroy({ force: true }); 
      res.status(200).json({
        message: "Role change request permanently deleted successfully",
      });
    } else {
      await request.destroy();
      res
        .status(200)
        .json({ message: "Role change request soft-deleted successfully" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};


exports.statusRoleChangeRequest = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log("Status:", status, "ID:", id);

  try {
    const role = await RoleChangeRequest.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: "Role change request not found." });
    }

    // Dynamically compute `requested_role` based on `status`
    const requested_role = status === 'approved' ? 'host' : 'guest';

    // Log the changes
    console.log("Updating Role:", { status, requested_role });

    // Update the fields
    role.status = status;
    role.requested_role = requested_role;
    await role.save();

    res.status(200).json({ 
      message: "Role change request updated successfully.", 
      status, 
      requested_role 
    });
  } catch (error) {
    console.error("Error updating role change request:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};