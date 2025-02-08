import dotenv = require('dotenv');
import { Dialect, Options } from 'sequelize';

dotenv.config();

type Config = {
  development: Options;
  test: Options;
  production: Options;
};

const config_production: Options = {
  dialect: (process.env.DB_DIALECT as Dialect) || 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE || 'development',
  username: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  logging: false
};

if (config_production.dialect === 'mssql') {
  config_production.dialectOptions = {
    encrypt: true,
    trustServerCertificate: false,
    hostNameInCertificate: '*.database.windows.net'
  };
}

// todo config
const config_development: Options = {
  dialect: (process.env.DB_DIALECT as Dialect) || 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE || 'development',
  username: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  logging: false
};

if (config_development.dialect === 'mssql') {
  config_development.dialectOptions = {
    encrypt: true,
    trustServerCertificate: false,
    hostNameInCertificate: '*.database.windows.net'
  };
}

// todo config
const config_test: Options = {
  dialect: (process.env.DB_DIALECT as Dialect) || 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE || 'development',
  username: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  logging: false
};

if (config_test.dialect === 'mssql') {
  config_test.dialectOptions = {
    encrypt: true,
    trustServerCertificate: false,
    hostNameInCertificate: '*.database.windows.net'
  };
}

const configs: Config = {
  development: config_development,
  test: config_test,
  production: config_production
};

module.exports = configs;
