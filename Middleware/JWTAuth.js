const JWT = require("jsonwebtoken"); // JSON Web Token

//Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");

module.exports = (req, res, next) => {
  try {
    const token = req.header.authorization.split(""[1]);
    const user = JWT.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(ResponseCode.NOT_SUCCESS).json({
      code: ResponseCode.NOT_SUCCESS,
      message: Message.AUTHENTICATION_FAILED,
    });
  }
};
