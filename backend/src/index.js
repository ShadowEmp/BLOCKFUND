const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require('./models');
const Campaign = require('./models/Campaign');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Main Routes
const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

// Sync Database and Start Server
const PORT = process.env.PORT || 5000;

const ensureCampaignSchema = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = Campaign.getTableName();
  const table = await queryInterface.describeTable(tableName);

  if (!table.contract_address) {
    await queryInterface.addColumn(tableName, 'contract_address', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    console.log('Added Campaign.contract_address column');
  }
};

sequelize.sync() // Auto-creates tables if they don't exist without violating SQLite FK constraints
  .then(ensureCampaignSchema)
  .then(() => {
    console.log('Database connected and synced');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });
