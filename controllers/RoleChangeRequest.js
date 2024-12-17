const RoleChangeRequest = require('../models/RoleChangeRequest');
const User = require('../models/User');

exports.getPendingRoleChangeRequests = async (req, res) => {
    try {
        
        const pendingRequests = await RoleChangeRequest.findAll({
            where: { status: 'pending' },
            // include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }],
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

        if (!request) return res.status(404).json({ message: "Request not found." });

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

