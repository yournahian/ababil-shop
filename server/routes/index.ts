import express from 'express';
import { getProducts } from '../controllers/index.js';

const router = express.Router();

// Product routes
router.get('/products', getProducts);

export default router;
