// next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Allow dev access from LAN IPs (for mobile testing)
  allowedDevOrigins: [
    '192.168.1.22',
    '192.168.1.22:3000',
    'http://192.168.1.22:3000',
    'localhost',
    'localhost:3000',
    'http://localhost:3000',
    // Allow any 192.168.x.x or 10.x.x.x address
    '192.168.*.*',
    '10.*.*.*',
  ],
};

module.exports = nextConfig;