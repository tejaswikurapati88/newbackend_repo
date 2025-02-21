const UAParser = require("ua-parser-js");

const getDeviceInfo = (req) => {
  const userAgentString = req.headers["user-agent"];
  if (!userAgentString) {
    return {
      userAgent: "Unknown User Agent",
      ipAddress: "Unknown IP",
      deviceName: "Unknown Device",
    };
  }

  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  // Extract accurate device name
  const deviceName =
    result.device.model ||
    `${result.os.name} (${result.browser.name})` ||
    "Unknown Device";

  // Format IP (handles IPv6 and multi-address cases)
  const formatIP = (ip) => (ip?.includes("::ffff:") ? ip.split(":").pop() : ip);

  const ipAddress =
    formatIP(req.headers["x-forwarded-for"]?.split(",")[0].trim()) ||
    formatIP(req.socket?.remoteAddress) ||
    "Unknown IP";

  return { userAgent: userAgentString, ipAddress, deviceName };
};

module.exports = getDeviceInfo;
