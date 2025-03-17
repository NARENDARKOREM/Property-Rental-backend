const Setting = require('../models/Setting');

const SettingAPI = async(req,res)=>{
    const uid = req.user.id;
    if(!uid){
        return res.status(401).json({message:"User not found!"})
    }
    try {
        const setting = await Setting.findOne({attributes:["tax","admin_tax","terms_conditions","privacy_policy"]});
    if(!setting){
        return res.status(404).json({message:"Setting not found!"})
    }
    return res.status(200).json({message:"Settings Fetched Successfully",setting})
    } catch (error) {
        console.error("Error Occurs while fetching settings",error)
        return res.status(500).json("Internal Server Error",error)
    }
}

const GetPolicySetting = async(req,res)=>{
    try {
        const policySettings = await Setting.findOne({attributes:["privacy_policy","terms_conditions"]})
        if(!policySettings){
            return res.status(404).json({message:"Policy Setting not found"});
        }
        return res.status(200).json({message:"Privacy Policy/Terms & Conditions Fetched Successfully.",policySettings})
    } catch (error) {
        console.error("Error Occurs while fetching settings",error)
        return res.status(500).json("Internal Server Error",error)
    }
}

module.exports = {SettingAPI,GetPolicySetting}