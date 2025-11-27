module.exports = {
  apps: [
    {
      name: 'anvil',
      script: 'anvil',
      args: '--host 0.0.0.0 --port 8545 --chain-id 31337',
      cwd: process.env.PROJECT_ROOT || './',
      error_file: './logs/anvil-error.log',
      out_file: './logs/anvil.log',
      log_file: './logs/anvil-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'sbc-frontend',
      script: process.env.PACKAGE_MANAGER === 'yarn' ? 'yarn' : (process.env.PACKAGE_MANAGER === 'npm' ? 'npm' : 'pnpm'),
      args: process.env.PACKAGE_MANAGER === 'yarn' ? 'dev --host 0.0.0.0 --port 5173' : 'run dev --host 0.0.0.0 --port 5173',
      cwd: process.env.FRONTEND_DIR || './frontend',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};

