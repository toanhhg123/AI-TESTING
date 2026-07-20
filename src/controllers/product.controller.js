const mongoose = require('mongoose');
const natural = require('natural');

const Product = require('../models/Product');
const { createSlug } = require('../utils/slug');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;
const MAX_PRODUCT_IMAGES = 5;
const MAX_IMAGE_STRING_LENGTH = 4 * 1024 * 1024;
const BASE64_IMAGE_PATTERN = /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i;

function toNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isValidImageSource(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const source = value.trim();

  if (!source || source.length > MAX_IMAGE_STRING_LENGTH) {
    return false;
  }

  if (BASE64_IMAGE_PATTERN.test(source)) {
    return true;
  }

  try {
    const url = new URL(source);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (_error) {
    return false;
  }
}

function buildProductFilter(query, options = {}) {
  const filter = {};
  const includeDeleted = options.includeDeleted === true;

  if (!includeDeleted) {
    filter.status = { $ne: 'deleted' };
  }

  if (query.status) {
    filter.status = query.status;
  } else if (options.publicOnly) {
    filter.status = 'active';
  }

  if (query.brand) {
    filter.brand = new RegExp(`^${escapeRegex(query.brand)}$`, 'i');
  }

  if (query.category) {
    filter.category = new RegExp(`^${escapeRegex(query.category)}$`, 'i');
  }

  if (query.ram) {
    filter['specifications.ram'] = new RegExp(`^${escapeRegex(query.ram)}$`, 'i');
  }

  if (query.storage) {
    filter['specifications.storage'] = new RegExp(`^${escapeRegex(query.storage)}$`, 'i');
  }

  const minPrice = toNumber(query.minPrice, null);
  const maxPrice = toNumber(query.maxPrice, null);

  if (minPrice !== null || maxPrice !== null) {
    filter.price = {};

    if (minPrice !== null) {
      filter.price.$gte = minPrice;
    }

    if (maxPrice !== null) {
      filter.price.$lte = maxPrice;
    }
  }

  const keyword = query.keyword || query.q;

  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), 'i');
    filter.$or = [
      { name: regex },
      { brand: regex },
      { category: regex },
      { description: regex },
      { tags: regex },
    ];
  }

  return filter;
}

function buildSort(sort) {
  switch (sort) {
    case 'price_asc':
      return { price: 1, createdAt: -1 };
    case 'price_desc':
      return { price: -1, createdAt: -1 };
    case 'name_asc':
      return { name: 1 };
    case 'best_selling':
      return { soldCount: -1, createdAt: -1 };
    case 'featured':
      return { isFeatured: -1, createdAt: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
}

function normalizePagination(query) {
  const page = Math.max(toNumber(query.page, DEFAULT_PAGE), 1);
  const limit = Math.min(Math.max(toNumber(query.limit, DEFAULT_LIMIT), 1), MAX_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

function normalizeProductPayload(payload, options = {}) {
  const product = {};
  const fields = [
    'name',
    'sku',
    'brand',
    'category',
    'description',
    'status',
  ];

  for (const field of fields) {
    if (payload[field] !== undefined) {
      product[field] = typeof payload[field] === 'string' ? payload[field].trim() : payload[field];
    }
  }

  if (product.sku === '') {
    delete product.sku;
  }

  if (payload.price !== undefined) {
    product.price = Number(payload.price);
  }

  if (payload.salePrice !== undefined) {
    product.salePrice = Number(payload.salePrice);
  }

  if (payload.stock !== undefined) {
    product.stock = Number(payload.stock);
  }

  if (payload.soldCount !== undefined) {
    product.soldCount = Number(payload.soldCount);
  }

  if (payload.isFeatured !== undefined) {
    product.isFeatured = Boolean(payload.isFeatured);
  }

  if (payload.images !== undefined) {
    product.images = Array.isArray(payload.images)
      ? payload.images
          .filter((image) => typeof image === 'string')
          .map((image) => image.trim())
          .filter(Boolean)
      : [];
  }

  if (payload.tags !== undefined) {
    product.tags = Array.isArray(payload.tags) ? payload.tags.filter(Boolean) : [];
  }

  if (payload.specifications !== undefined) {
    product.specifications =
      payload.specifications && typeof payload.specifications === 'object'
        ? payload.specifications
        : {};
  }

  if (product.name && (options.forceSlug || !payload.slug)) {
    product.slug = createSlug(product.name);
  } else if (payload.slug !== undefined) {
    product.slug = createSlug(payload.slug);
  }

  return product;
}

function validateProductPayload(payload, { partial = false } = {}) {
  const errors = [];

  if (!partial || payload.name !== undefined) {
    if (!payload.name || !String(payload.name).trim()) {
      errors.push('Tên sản phẩm không được để trống.');
    }
  }

  if (!partial || payload.brand !== undefined) {
    if (!payload.brand || !String(payload.brand).trim()) {
      errors.push('Thương hiệu không được để trống.');
    }
  }

  if (!partial || payload.category !== undefined) {
    if (!payload.category || !String(payload.category).trim()) {
      errors.push('Danh mục không được để trống.');
    }
  }

  for (const field of ['price', 'salePrice', 'stock', 'soldCount']) {
    if (payload[field] !== undefined) {
      const value = Number(payload[field]);

      if (!Number.isFinite(value) || value < 0) {
        errors.push(`${field} phải là số lớn hơn hoặc bằng 0.`);
      }
    }
  }

  if (payload.status !== undefined && !['active', 'inactive', 'deleted'].includes(payload.status)) {
    errors.push('Trạng thái sản phẩm không hợp lệ.');
  }

  if (payload.images !== undefined) {
    if (!Array.isArray(payload.images)) {
      errors.push('images phải là mảng ảnh.');
    } else if (payload.images.length > MAX_PRODUCT_IMAGES) {
      errors.push(`Chỉ được upload tối đa ${MAX_PRODUCT_IMAGES} ảnh cho một sản phẩm.`);
    } else if (payload.images.some((image) => !isValidImageSource(image))) {
      errors.push('Ảnh sản phẩm phải là URL http(s) hoặc base64 data URL hợp lệ, dung lượng dưới 4MB.');
    }
  }

  return errors;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function listPublicProducts(req, res, next) {
  try {
    const filter = buildProductFilter(req.query, { publicOnly: true });
    const sort = buildSort(req.query.sort);
    const { page, limit, skip } = normalizePagination(req.query);

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function searchProducts(req, res, next) {
  req.query.keyword = req.query.keyword || req.query.q;
  return listPublicProducts(req, res, next);
}

async function getProductDetail(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: 'ID sản phẩm không hợp lệ.',
      });
    }

    const product = await Product.findOne({
      _id: id,
      status: 'active',
    });

    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm.',
      });
    }

    res.json({
      product,
    });
  } catch (error) {
    next(error);
  }
}

async function getRecommendations(req, res, next) {
  try {
    const { productId, brand, category, limit = 8 } = req.query;
    const normalizedLimit = Math.min(Math.max(toNumber(limit, 8), 1), 24);
    const filter = { status: 'active' };

    if (productId && isValidObjectId(productId)) {
      const product = await Product.findById(productId);

      if (product) {
        filter._id = { $ne: product._id };
        filter.$or = [
          { brand: product.brand },
          { category: product.category },
          {
            price: {
              $gte: Math.max(product.price - 5000000, 0),
              $lte: product.price + 5000000,
            },
          },
        ];
      }
    } else {
      if (brand) {
        filter.brand = new RegExp(`^${escapeRegex(brand)}$`, 'i');
      }

      if (category) {
        filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
      }
    }

    const items = await Product.find(filter)
      .sort({ isFeatured: -1, soldCount: -1, createdAt: -1 })
      .limit(normalizedLimit);

    res.json({
      items,
    });
  } catch (error) {
    next(error);
  }
}

async function listAdminProducts(req, res, next) {
  try {
    const filter = buildProductFilter(req.query, { includeDeleted: true });
    const sort = buildSort(req.query.sort);
    const { page, limit, skip } = normalizePagination(req.query);

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const errors = validateProductPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Dữ liệu sản phẩm không hợp lệ.', errors });
    }

    const payload = normalizeProductPayload(req.body, { forceSlug: true });
    const product = await Product.create(payload);

    res.status(201).json({
      product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'SKU hoặc slug sản phẩm đã tồn tại.',
      });
    }

    next(error);
  }
}

async function getAdminProductDetail(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: 'ID sản phẩm không hợp lệ.',
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm.',
      });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: 'ID sản phẩm không hợp lệ.',
      });
    }

    const errors = validateProductPayload(req.body, { partial: true });

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Dữ liệu sản phẩm không hợp lệ.', errors });
    }

    const payload = normalizeProductPayload(req.body);
    const product = await Product.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm.',
      });
    }

    res.json({ product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'SKU hoặc slug sản phẩm đã tồn tại.',
      });
    }

    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: 'ID sản phẩm không hợp lệ.',
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { status: 'deleted' },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm.',
      });
    }

    res.json({
      message: 'Đã xóa sản phẩm.',
      product,
    });
  } catch (error) {
    next(error);
  }
}

async function getSimilarProducts(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID sản phẩm không hợp lệ.' });
    }

    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    // Fetch all active products
    const products = await Product.find({ status: 'active', _id: { $ne: currentProduct._id } });

    if (products.length === 0) {
      return res.json({ items: [] });
    }

    const tokenizer = new natural.WordTokenizer();

    // Prepare target product doc tokens
    const targetText = `${currentProduct.name} ${currentProduct.brand} ${currentProduct.category} ${currentProduct.description || ''}`.toLowerCase();
    const targetTokens = tokenizer.tokenize(targetText);

    // Prepare other products docs tokens
    const productDocs = products.map(p => {
      const text = `${p.name} ${p.brand} ${p.category} ${p.description || ''}`.toLowerCase();
      return tokenizer.tokenize(text);
    });

    // Prepare term frequencies
    const getTf = (tokens) => {
      const tf = {};
      tokens.forEach(t => {
        tf[t] = (tf[t] || 0) + 1;
      });
      return tf;
    };

    // Vocabulary of target + all candidates
    const vocabSet = new Set([...targetTokens]);
    productDocs.forEach(tokens => {
      tokens.forEach(t => vocabSet.add(t));
    });
    const vocab = Array.from(vocabSet);

    // Document Frequency (DF)
    const df = {};
    vocab.forEach(t => {
      let count = 0;
      if (targetTokens.includes(t)) count++;
      productDocs.forEach(tokens => {
        if (tokens.includes(t)) count++;
      });
      df[t] = count;
    });

    const N = products.length + 1;

    // Inverse Document Frequency (IDF)
    const idf = {};
    vocab.forEach(t => {
      idf[t] = Math.log(N / (df[t] || 1)) + 1;
    });

    // Helper to compute TF-IDF vector
    const getTfidfVector = (tokens) => {
      const tf = getTf(tokens);
      const vec = {};
      vocab.forEach(t => {
        vec[t] = (tf[t] || 0) * idf[t];
      });
      return vec;
    };

    const targetVector = getTfidfVector(targetTokens);
    
    // Compute magnitudes
    const getMagnitude = (vec) => {
      let sumSq = 0;
      vocab.forEach(t => {
        sumSq += Math.pow(vec[t] || 0, 2);
      });
      return Math.sqrt(sumSq);
    };

    const targetMag = getMagnitude(targetVector);

    const scoredProducts = products.map((p, idx) => {
      const tokens = productDocs[idx];
      const vector = getTfidfVector(tokens);
      const mag = getMagnitude(vector);

      // Dot product
      let dotProduct = 0;
      vocab.forEach(t => {
        dotProduct += (targetVector[t] || 0) * (vector[t] || 0);
      });

      const similarity = (targetMag === 0 || mag === 0) ? 0 : dotProduct / (targetMag * mag);

      return {
        product: p,
        similarity,
      };
    });

    // Sort by similarity score descending
    scoredProducts.sort((a, b) => b.similarity - a.similarity);

    // Limit to top 4 products
    const topProducts = scoredProducts.slice(0, 4).map(item => item.product);

    res.json({
      items: topProducts,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProduct,
  deleteProduct,
  getAdminProductDetail,
  getProductDetail,
  getRecommendations,
  listAdminProducts,
  listPublicProducts,
  searchProducts,
  updateProduct,
  getSimilarProducts,
};
