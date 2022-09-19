var FCM = require("fcm-node");
var serverKey =
  "AAAAI1DIQ60:APA91bF3MScx3UBHz6TpqDc1wnPFHBPGQMJFlj-vNJoWD5WhJVm1d7awlgC5speUq_81kuSyYLzW3dn7A1W9Jdyp2ghQKWQkAdfGbwWXV1imSHH9zZZsiPAbvcp_1HzrqzJkpE-SCrkY";
var fcm = new FCM(serverKey);
exports.sendPushNotification = async (deviceToken, notification, data) => {
  var message = {
    to: deviceToken,
    notification: notification,
    data: data,
  };

  fcm.send(message, function (err, response) {
    if (err) {
      // console.log("Something has gone wrong!" + err);
      // console.log("Respponse:! " + response);
      console.log("Error in notification");
    } else {
      // showToast("Successfully sent with response");
      // console.log("Successfully sent with response: ", response);
      console.log("Success in notification");
    }
  });
};
