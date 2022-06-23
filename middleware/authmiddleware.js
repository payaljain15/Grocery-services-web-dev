const jwt = require('jsonwebtoken');

const requireAuth = (req,res,next) => {
    const token = req.cookies.jwt_token;
    if(token){
        jwt.verify(token,process.env.JWT, (err,decodedtoken) => {
            if(err){
                console.log(err);
                res.redirect('/');
            } else{
                console.log(decodedtoken);
                next();
            }
        });
    }
    else {
        res.redirect('/');
    }
}

module.exports = {requireAuth};