const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const usePostgres = process.env.DB_DIALECT === 'postgres' && process.env.DATABASE_URL;

const sequelize = usePostgres
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../crowdfunding.sqlite'), // Auto-creates file in backend root
      logging: false,
    });

module.exports = sequelize;
