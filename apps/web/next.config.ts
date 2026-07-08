import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
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
