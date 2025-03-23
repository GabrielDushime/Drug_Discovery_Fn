
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    'rc-util',
    'rc-input',
    'antd',
    '@ant-design',
    '@antv',
    'rc-pagination',
    'rc-picker',
    'rc-dropdown',
    'rc-field-form',
    'rc-tree',
    'd3-hierarchy',
    'rc-table' 
  ],
  
  webpack: (config, { isServer }) => {
    
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@ant-design/icons/lib/dist$': '@ant-design/icons/lib/index.js',
      'react': path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    };

    
    if (isServer) {
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();
        
        return entries;
      };
    }

    
    config.module.rules.push({
      test: /\.m?js$/,
      include: [
        /node_modules\/@antv/,
        /node_modules\/d3-hierarchy/,
        /node_modules\/rc-tree/
      ],
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: [
        
            ['@babel/plugin-transform-modules-commonjs', { loose: true }]
          ]
        }
      }
    });

    return config;
  },
  

  experimental: {
    esmExternals: 'loose', 
  },
  output: 'standalone',
   output: 'export',
};

module.exports = nextConfig;