const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      require('remark-gfm'),
      require('remark-frontmatter')
    ],
    rehypePlugins: [
      require('rehype-slug'),
      [
        require('rehype-autolink-headings'),
        {
          behavior: 'wrap',
          properties: {
            className: ['anchor-link']
          }
        }
      ],
      [
        require('rehype-highlight'),
        {
          detect: true,
          ignoreMissing: true
        }
      ]
    ],
    // Use React 18 JSX transform
    development: process.env.NODE_ENV === 'development',
    providerImportSource: '@mdx-js/react'
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  
  // Enable experimental features
  experimental: {
    mdxRs: false, // Use @next/mdx instead of the experimental Rust-based MDX
    optimizePackageImports: [
      'lucide-react',
      '@mdx-js/react'
    ]
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          }
        ]
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  },

  // Bundle analyzer
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')();
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: './analyze/client.html'
        })
      );
      return config;
    }
  }),

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'commons',
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            shared: {
              name: 'shared',
              priority: 20,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // MDX and TypeScript optimizations
    config.module.rules.push({
      test: /\.mdx$/,
      use: [
        {
          loader: '@mdx-js/loader',
          options: {
            development: dev,
          },
        },
      ],
    });

    return config;
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['app', 'lib', 'components'],
  },

  // Output configuration
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Trailing slash
  trailingSlash: false,

  // Power by header
  poweredByHeader: false,

  // Compression
  compress: true,

  // Generate ETags
  generateEtags: true,

  // React strict mode
  reactStrictMode: true,
};

module.exports = withMDX(nextConfig);