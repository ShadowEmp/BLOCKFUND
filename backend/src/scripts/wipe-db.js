const sequelize = require('../models/index');

async function wipe() {
    console.log("⚠️  Wiping all data from SQLite...");
    try {
        await sequelize.sync({ force: true });
        console.log("✅ Database wiped and reset. All tables recreated.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to wipe database:", error);
        process.exit(1);
    }
}

wipe();
