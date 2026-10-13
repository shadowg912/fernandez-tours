import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "pg-connection-string", "pgpass"],
};

export default nextConfig;
