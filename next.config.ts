import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/rpc',
        destination: 'https://rpc-testnet.onelabs.cc',
      },
    ];
  },
};

export default nextConfig;
