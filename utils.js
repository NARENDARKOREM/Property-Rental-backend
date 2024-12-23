/**
 * Utility function to send a formatted response.
 * 
 * @param {Object} res - The Express response object.
 * @param {number} code - HTTP status code.
 * @param {string} result - Result status ("true" or "false").
 * @param {string} message - Response message.
 * @param {Object} [data={}] - Additional data to include in the response (optional).
 */
const sendResponse = (res, code, result, message, data = {}) => {
    const response = {
      ResponseCode: code,
      Result: result,
      ResponseMsg: message,
      ...(Object.keys(data).length && { data }),
    };
  
    res.status(code).json(response);
  };
  
  module.exports = { sendResponse };
  