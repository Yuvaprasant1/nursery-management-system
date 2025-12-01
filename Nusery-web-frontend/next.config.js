/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src'),
    }
    return config
  },
  
  // Proxy API requests to backend
  async rewrites() {
    const isProduction = process.env.NODE_ENV === 'production'
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
  
  // Environment variables (for server-side access)
  // Client-side should use NEXT_PUBLIC_ prefix
  env: {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:8080',
    APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || process.env.APP_NAME || 'Nursery Management System',
    APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || process.env.APP_ENV || process.env.NODE_ENV || 'development',
  },
}

module.exports = nextConfig

