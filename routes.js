const router = require('express').Router();
const mongo = require("./mongo");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const joi = require("joi")

let mailSchema = joi.object({
    email: joi.string().email().required()
})


// sending the mail with the password reset link
sendMail = async (userWithToken) => {
    
    let transporter = nodemailer.createTransport({
        name:"passreset.com",
        service:"gmail" ,
        auth: {
          user: process.env.MAIL_USER, 
          pass: process.env.MAIL_PASS,
        },
      });
    
    let mailOptions = {
        from: 'no-reply',
        to: `${userWithToken.email}`,
        subject: 'Password reset request',
        html: `
        <p>Please use the link below to reset your password</p>
        <h4>The below link will expire in 15 minutes</h4>
        <h5>Click on this <a href="${process.env.CLIENT_URL}/chng_pwd/${userWithToken.token}" target="_blank">link</a> to reset password</h5>
        `
    };
    

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            return false
        } else {
            console.log('Email sent: ' + info.response);
            return true
        }
      });

}

//storing the temp_token inside the users document
generateEmail = async (email,user) => {
    const salt = await bcrypt.genSalt();
    const temp_pwd = (await bcrypt.hash(email, salt)).split('/').join('');
    if (user.token !== temp_pwd) {
        const userWithToken = await mongo.db.collection('users').findOneAndUpdate(
            { email: email },
            { $set: { token: temp_pwd, expiry: Date.now() + 900000 } },
            { returnDocument: "after" });
        const mail_rspns = sendMail(userWithToken.value);
        return mail_rspns
    } else {
        return "duplicate"
    }
   
}

//API request to validate the email
router.post("/checkEmail", async (req, res) => {
    
    let {error} = mailSchema.validate({email:req.body.email})

    if (!error) {
        const users = await mongo.db.collection('users').find().toArray();
        let index = users.findIndex(user => user.email === req.body.email);
        if (index >= 0) {
            let result = generateEmail(req.body.email, users[index]);
            if (result !== 'duplicate') {
                res.send("available");
            } else {
                res.sendStatus(400);
            }
        
        } else {
            res.sendStatus(400);
        }
    } else {
        res.send(error.details[0].message)
    }
})

// APi request to reset the password
router.patch('/reset-password', async(req, res) => {
    const { token, new_pwd } = req.body;
    const userDetails = await mongo.db.collection('users').findOneAndUpdate(
        { token: token, expiry: { $gt: Date.now() } },
        { $set: { password: new_pwd,token:"",expiry:0 } },
        { returnDocument: "after" });
    if (userDetails.value !== null) {
        res.sendStatus(200);
    } else {
        res.send('link expired');
    }
})



module.exports = router