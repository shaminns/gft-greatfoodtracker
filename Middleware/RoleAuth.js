//Constants

const Message = require("../Constants/Message");
const ResponseCode = require("../Constants/ResponseCode");

exports.check = (role) => {
  return (req, res, next) => {
    if (req.user.role == role) {
      next();
    } else {
      return res.status(ResponseCode.NOT_SUCCESS).json({
        code: ResponseCode.NOT_SUCCESS,
        message: Message.PERMISSION_DENIED,
      });
    }
  };
};
