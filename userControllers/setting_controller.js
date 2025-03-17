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

const updateSetting = async(req,res)=>{
    const uid = req.user.id;
    if(!uid){
        return res.status(401).json({message:"User not foud"});
    }
    const {privacy_policy,terms_conditions}=req.body;
    try {
        const setting = await Setting.findOne();
        if(!setting){
            return res.status(404).json({message:"Setting not found"});
        }
        setting.privacy_policy=privacy_policy ?? setting.privacy_policy;
        setting.terms_conditions=terms_conditions ?? setting.terms_conditions;

        await setting.save();
        return res.status(200).json({
            message:"Setting updated Successfully",
            setting:{
                privacy_policy:privacy_policy,
                terms_conditions:terms_conditions,
            }
        })
    } catch (error) {
        console.error("Error Occurs While updating Settings: ",error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

module.exports = {SettingAPI,updateSetting}