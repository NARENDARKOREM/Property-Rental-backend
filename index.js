const express = require("express");
const app = express();
const dotEnv = require("dotenv");
const sequelize = require("./db")
const PORT = process.env.PORT || 5000;
dotEnv.config();

app.get('/',(req,res)=>{
    res.send("Server is Running");
})

sequelize.sync()
    .then(() => {
        console.log('Database & tables created!');
    })
    .catch(err => {
        console.error('Unable to create the database:', err);
    });

app.listen(PORT,()=>{
    console.log(`Server is Running on PORT http://localhost:${PORT}`);
})

