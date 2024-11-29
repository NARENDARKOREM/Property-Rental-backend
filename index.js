const express = require("express");
const app = express();
const dotEnv = require("dotenv");
const PORT = process.env.PORT || 5000;

app.get('/',(req,res)=>{
    res.send("Server is Running");
})

app.listen(PORT,()=>{
    console.log(`Server is Running on PORT http://localhost:${PORT}`);
})

