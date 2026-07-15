const mongoose = require('mongoose');
const ImportReceipt = require('../models/ImportReceipt');
const Product = require('../models/Product');

async function createImportReceipt(req, res, next) {
  try {
    const { supplier, items } = req.body;

    if (!supplier || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp nhà cung cấp và danh sách sản phẩm nhập hàng.',
      });
    }

    let totalAmount = 0;
    const itemsPayload = [];

    for (const item of items) {
      if (!item.product || !item.quantity || !item.importPrice) {
        return res.status(400).json({
          message: 'Dữ liệu các mặt hàng nhập không hợp lệ.',
        });
      }

      const quantity = parseInt(item.quantity);
      const importPrice = parseFloat(item.importPrice);

      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({
          message: 'Số lượng nhập phải lớn hơn 0.',
        });
      }

      if (isNaN(importPrice) || importPrice < 0) {
        return res.status(400).json({
          message: 'Đơn giá nhập không hợp lệ.',
        });
      }

      totalAmount += quantity * importPrice;
      itemsPayload.push({
        product: item.product,
        quantity,
        importPrice,
      });
    }

    // Create receipt
    const receipt = await ImportReceipt.create({
      supplier: supplier.trim(),
      items: itemsPayload,
      totalAmount,
      creator: req.user._id,
    });

    // Update stock for each product
    for (const item of itemsPayload) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    res.status(201).json({
      message: 'Tạo phiếu nhập hàng và cập nhật kho thành công.',
      receipt,
    });
  } catch (error) {
    next(error);
  }
}

async function listImportReceipts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);

    const total = await ImportReceipt.countDocuments();
    const receipts = await ImportReceipt.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('creator', 'fullName')
      .populate('items.product', 'name brand price images');

    res.json({
      items: receipts,
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

async function getImportReceiptDetail(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Mã phiếu nhập không hợp lệ.' });
    }

    const receipt = await ImportReceipt.findById(id)
      .populate('creator', 'fullName email')
      .populate('items.product', 'name brand price salePrice images stock');

    if (!receipt) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu nhập hàng.' });
    }

    res.json({ receipt });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createImportReceipt,
  listImportReceipts,
  getImportReceiptDetail,
};
