const jwt = require('jsonwebtoken');

const middleware = {
    requireAuth: (req,res,next) => {
        const token = req.cookies.jwt_token;
        if(token){
            jwt.verify(token,process.env.JWT, (err,decodedtoken) => {
                if(err){
                    console.log(err);
                    res.redirect('/');
                } else{
                    console.log(decodedtoken,1);
                    next();
                }
            });
        }
        else {
            res.redirect('/');
        }
    }
}

module.exports = {middleware};