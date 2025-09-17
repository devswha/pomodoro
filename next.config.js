/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  // Configure for Netlify deployment - static export for pages only
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // API routes will be handled separately via Netlify Functions
  // Remove API routes rewrites for static export
  // API routes will be handled by netlify.toml redirects
  // Environment variables for API routes
  env: {
    CUSTOM_KEY: 'my-value',
  },
  // Disable server-side features for static export in production
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Exclude legacy React files from Next.js build
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Exclude src directory from webpack compilation
    config.externals = config.externals || {};
    config.externals = [...config.externals, 'src/**/*'];
    
    // Handle Node.js modules for API routes
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
  // Build configuration
  generateBuildId: async () => {
    return process.env.NODE_ENV === 'production' ? 'static-build' : 'dev-build'
  },
  // Performance optimizations
  swcMinify: true,
  poweredByHeader: false,
  
  // Static export configuration
}

export default nextConfig;