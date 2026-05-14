const express = require('express');
const router = express.Router();

// GET /api/opt-outs
router.get('/', async (req, res) => {
  res.status(501).json({ message: 'List opt-outs not implemented' });
});

// POST /api/opt-outs (add a number to opt-out list)
router.post('/', async (req, res) => {
  res.status(501).json({ message: 'Create opt-out not implemented' });
});

module.exports = router;
