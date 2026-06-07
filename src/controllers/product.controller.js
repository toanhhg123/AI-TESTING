const mongoose = require('mongoose');

const Product = require('../models/Product');
const { createSlug } = require('../utils/slug');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

function toNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    product.images = Array.isArray(payload.images) ? payload.images.filter(Boolean) : [];
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
};
