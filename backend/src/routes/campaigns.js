const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const Campaign = require('../models/Campaign');
const authenticateToken = require('../middleware/auth');
const { uploadFileToIPFS } = require('../services/ipfsService');

// Multer setup for temporary storage
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  },
});

const cleanupUploadedFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({ order: [['created_at', 'DESC']] });
    res.json(campaigns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get a single campaign
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Upload campaign image before writing the on-chain campaign
router.post('/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });

    const ipfs_hash = await uploadFileToIPFS(req.file);
    res.status(201).json({ ipfs_hash });
  } catch (error) {
    console.error("CAMPAIGN_IMAGE_UPLOAD_ERROR:", error);
    res.status(500).json({
      error: 'Failed to upload image',
      details: error.message,
    });
  } finally {
    cleanupUploadedFile(req.file);
  }
});

// Create campaign (auth required)
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, description, goal, deadline, contract_campaign_id, contract_address } = req.body;
    let ipfs_hash = req.body.ipfs_hash || null;

    if (req.file) {
      // Upload to IPFS via Pinata
      ipfs_hash = await uploadFileToIPFS(req.file);
    }

    const campaign = await Campaign.create({
      title,
      description,
      goal,
      deadline,
      ipfs_hash,
      contract_campaign_id, // Passed from frontend after smart contract interaction
      contract_address,
      creator_wallet: req.user.wallet_address
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error("CAMPAIGN_CREATE_ERROR:", error);
    res.status(500).json({ 
      error: 'Failed to create campaign', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    cleanupUploadedFile(req.file);
  }
});

module.exports = router;
