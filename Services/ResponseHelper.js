function getDefaultResponse() {
  return {
    code: 400,
    message: "Something went wrong.",
  };
}

function setResponse(code, message, result = null) {
  return {
    code: code,
    result: result,
    message: message,
  };
}

module.exports = { getDefaultResponse, setResponse };
