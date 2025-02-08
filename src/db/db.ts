import { Sequelize } from 'sequelize';
// import configs from '../db/config/config';
const configs = require('../db/config/config');

const env = (process.env.NODE_ENV || 'development') as keyof typeof configs;
const config = configs[env];

const db: Sequelize = new Sequelize({
  ...config
});

export default db;
