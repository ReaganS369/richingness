import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  allowedDevOrigins: ['*.trycloudflare.com', '*.loca.lt', 'localhost', '10.164.131.9'],
  transpilePackages: [
    '@repo/ui',
    '@repo/design-system',
    'nativewind',
    'react-native-css-interop',
    'react-native',
    'react-native-web'
  ]
};

export default nextConfig;
