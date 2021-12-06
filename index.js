const express = require('express');
const app = express();
require('dotenv').config();
const mongo = require("./mongo");
const routes = require("./routes");
const cors = require('cors')


//you can check the reset mail in the same mail id in .env, password is also given in .env


loadApp = async () => {
   try{ 
       await mongo.connect();
       
       app.use(cors({
        origin: process.env.CLIENT_URL,
        credentials:true,     
        optionSuccessStatus:200
    }))

    app.use(express.json());
    app.use('/', routes);

    app.listen(process.env.PORT, (req, res) =>{
        console.log("server connected")
    })
   } catch (err) {
       console.error(err);
   }
}



loadApp()
