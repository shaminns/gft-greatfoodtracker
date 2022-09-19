function define(name, value) {
  Object.defineProperty(exports, name, {
    value: value,
    enumerable: true,
  });
}
// General Messages
define("REQUEST_SUCCESSFUL", "Request successful.");
define("INVALID_PASSWORD", "Invalid password.");

define("INVALID_EMAIL", "Invalid Email");
define("INVALID_ACTIVATION_CODE", "Invalid Activation Code");
define("ACTIVATE_SUCCESSFUL", "User Successfully Activated");
define("ALREADY_ACTIVATED", "User Already Activated");

define("LOGIN_SUCCESS", "You are successfully logged in.");
define("WENT_WRONG", "Something went wrong!");
define("EMAIL_RECEIVED_SHORTLY", "You will receive an email shortly.");
define("MISSING_PARAMETER", "Missing Parameter.");
define("MISSING_PAGE_NUMBER", "Missing Page Number.");
define("AUTHENTICATION_FAILED", "Authentication Failed!");
define("PERMISSION_DENIED", "You don't have permission for this operation!");
define("ALREADY_EXIST", "Already exist!");
define("PASSWORD_NOT_MATCH", "Passwords not Match");
define("INVALID_TOKEN", "Invalid Token");
define("TOKEN_NOT_FOUND", "Token not found");

define("OLD_NEW_PASSWORD_SAME", "New Password must be change from old");

// User Messages
define("USER_NOT_EXIST", "User does not exist.");
define("USER_ADDED_SUCCESS", "User was added successfully.");
define("EMAIL_EXIST", "Oops - email already exists.");
define("EMAIL_NOT_EXIST", "Email does not exist.");
define("DUPLICATE_USERNAME_EMAIL", "Duplicate Username or Emails");

// Image Messages
define("IMAGE_UPDATE_SUCCESS", "Image was updated successfully.");
define("IMAGE_UPLOAD_SUCCESS", "Image was uploaded successfully.");
define("IMAGE_REMOVED_SUCCESS", "Image was removed successfully.");

define("IMAGE_NOT_READ", "Image not read");

// Email Subjects
define("REGISTER_SUCCESS", "Registration Successful!");
define("RESET_PASSWORD", "Reset Password!");

//User
define("NOT_ACTIVATED", "User not activated");
define("USER_ACTIVATED", "User is activated");
define("UPDATE_SUCCESS", "Update Successfully");
define("LOCATION_UPDATE_SUCCESS", "Location Update Successfully");
define("DELETE_SUCCESSFUL", "Deleted Successful");
define("UNDELETE_SUCCESSFUL", "Un-Deleted Successful");
define("WRONG_PASSWORD", "Wrong Password");
define("WRONG_OLD_PASSWORD", "Old Password not match");

//Authentication Invalid
define("EMAIL_REQUIRED", "Email required for this operation");
define("ROLE_NOT_ALLOWED", "Select appropriate option for delete");
define("ADMIN_ROLE", "Admin can not delete");

//Package
define("PACKAGE_NULL", "Package not found");
define("PACKAGE_NOT_FOUND", "Package not found aginst given Package ID");
define("PACKAGE_ERROR", "Package not Selected");
define("PACKAGE_NOT_APPROVED", "Pending package approval");
define("PACKAGE_SELECTED", "Package selected");

//Image UPload
define("LIMIT_EXCEEDED", "Upload limit exceeded");
define("IMAGE_TYPE_ERROR", "Image must be JPG,JPEG or PNG");

//Credit Card
define("INVALID_CARD_NUMBER", "Invalid credit card number");
define("INVALID_CVV_CODE", "Invalid CVV code");
define("INVALID_EXPIRY_DATE", "Invalid card expiry date");
define("CARD_EXPIRE", "Credit card expired");

//Acount Detail
define("INVALID_ACCOUNT_NUMBER", "Invalid account number");
define("SAME_ACCOUNT_ERROR", "Confirm account number not same");

//Order
define("SELECT_COOKED_TIME", "Please select estimated cooked time");

//Menu
define("PRICE_ERROR", "Discount price must be less than total price");
define("PERCENTAGE_ERROR", "Discount percentage must be less than 100");

define("RECORD_NOT_FOUND", "Record not found");
define("NOT_EXIST", "Record not exist");
define("CARD_NOT_FOUND", "Invalid / not found card");

define("IN_USE", "Gategory already selected by someone, Can't Deleted");

define("CART_EMPTY", "Cart Empty");
