const TblBook = require('../models/TblBook');

const travelerBookingAmountRefund = async(req,res)=>{
    const uid = req.user.id;
    if(!uid){
        return res.status(401).json({message:"User not found!"})
    }

    const {transaction_id, notes, amount}=req.body
    const KEY_ID='key_id'
    const SECRET_KEY='secret_key'
    const URL=`https://api.razorpay.com/v1/payments/${transaction_id}/refund`

    try {
        const booking = await TblBook.findOne({where:{transaction_id:transaction_id}})
        if(!booking){
            return res.status(404).json({message:"Booking not found!"})
        }
    } catch (error) {
        
    }
}