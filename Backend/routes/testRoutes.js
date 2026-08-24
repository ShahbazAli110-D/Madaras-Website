const express = require('express');
const { getHome } = require('../controllers/testController');

const router = express.Router();

router.get('/', getHome);

module.exports = router;