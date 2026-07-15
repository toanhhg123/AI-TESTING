const Coupon = require('../models/Coupon');

async function validateCoupon(req, res, next) {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Vui lòng nhập mã giảm giá.' });
    }

    if (orderAmount === undefined || isNaN(orderAmount) || orderAmount < 0) {
      return res.status(400).json({ message: 'Số tiền đơn hàng không hợp lệ.' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại.' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: 'Mã giảm giá này đã bị vô hiệu hóa.' });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'Mã giảm giá này đã hết hạn sử dụng.' });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Mã giảm giá này chỉ áp dụng cho đơn hàng tối thiểu từ ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ.`,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    }

    // Discount cannot exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    res.json({
      message: 'Áp dụng mã giảm giá thành công.',
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: parseFloat(discountAmount.toFixed(0)),
    });
  } catch (error) {
    next(error);
  }
}

// Admin CRUD
async function listCoupons(req, res, next) {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    next(error);
  }
}

async function createCoupon(req, res, next) {
  try {
    const { code, discountType, discountValue, minOrderAmount, expiryDate, isActive } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin mã giảm giá.' });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'Mã giảm giá này đã tồn tại.' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      expiryDate,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
}

async function updateCoupon(req, res, next) {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, minOrderAmount, expiryDate, isActive } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá.' });
    }

    if (code) {
      const normalizedCode = code.toUpperCase().trim();
      if (normalizedCode !== coupon.code) {
        const existing = await Coupon.findOne({ code: normalizedCode });
        if (existing) {
          return res.status(400).json({ message: 'Mã giảm giá này đã tồn tại.' });
        }
        coupon.code = normalizedCode;
      }
    }

    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();
    res.json(coupon);
  } catch (error) {
    next(error);
  }
}

async function deleteCoupon(req, res, next) {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá.' });
    }
    res.json({ message: 'Xóa mã giảm giá thành công.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateCoupon,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
