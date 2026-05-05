const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Campaign = require('./Campaign');
const User = require('./User');

const Contribution = sequelize.define('Contribution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  amount_eth: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
  },
  tx_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  contributor_wallet: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Contribution.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'Campaign' });
Contribution.belongsTo(User, { foreignKey: 'contributor_wallet', targetKey: 'wallet_address', as: 'Contributor' });
Campaign.hasMany(Contribution, { foreignKey: 'campaign_id', as: 'Contributions' });

module.exports = Contribution;
