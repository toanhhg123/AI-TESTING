const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const env = require('../config/env');
const stripe = env.stripeSecretKey ? require('stripe')(env.stripeSecretKey) : null;

async function createOrder(req, res, next) {
  try {
    const { shippingAddress, phoneNumber, receiverName, paymentMethod = 'cod', couponCode } = req.body;

    if (!shippingAddress || !phoneNumber || !receiverName) {
      return res.status(400).json({
        message: 'Vui lòng điền đầy đủ họ tên người nhận, số điện thoại và địa chỉ giao hàng.',
      });
    }

    // Retrieve user's cart
    const cart = await Cart.findOne({ customer: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng của bạn đang trống.' });
    }

    const orderItems = [];
    let totalAmount = 0;

    // Verify stock and calculate total amount
    for (const item of cart.items) {
      const product = item.product;

      if (!product || product.status !== 'active') {
        return res.status(400).json({
          message: `Sản phẩm "${product?.name || 'Không xác định'}" hiện tại không khả dụng.`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Sản phẩm "${product.name}" không đủ hàng trong kho (Còn lại: ${product.stock}).`,
        });
      }

      const finalPrice =
        product.salePrice && product.salePrice > 0 && product.salePrice < product.price
          ? product.salePrice
          : product.price;

      totalAmount += finalPrice * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: finalPrice,
      });
    }

    // Process coupon code
    const baseSubtotal = totalAmount;
    let discountAmount = 0;
    let appliedCouponCode = '';

    if (couponCode) {
      const Coupon = require('../models/Coupon');
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
      if (!coupon) {
        return res.status(400).json({ message: 'Mã giảm giá không tồn tại.' });
      }
      if (!coupon.isActive) {
        return res.status(400).json({ message: 'Mã giảm giá đã bị vô hiệu hóa.' });
      }
      if (new Date(coupon.expiryDate) < new Date()) {
        return res.status(400).json({ message: 'Mã giảm giá đã hết hạn.' });
      }
      if (baseSubtotal < coupon.minOrderAmount) {
        return res.status(400).json({
          message: `Mã giảm giá yêu cầu đơn hàng từ ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ.`,
        });
      }

      if (coupon.discountType === 'percentage') {
        discountAmount = (baseSubtotal * coupon.discountValue) / 100;
      } else if (coupon.discountType === 'fixed') {
        discountAmount = coupon.discountValue;
      }
      discountAmount = Math.min(discountAmount, baseSubtotal);
      appliedCouponCode = coupon.code;
    }

    const shippingFee = baseSubtotal > 15000000 ? 0 : 30000;
    const finalTotalAmount = Math.max(0, baseSubtotal - discountAmount) + shippingFee;

    // Create the order
    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      totalAmount: finalTotalAmount,
      paymentMethod,
      shippingAddress: shippingAddress.trim(),
      phoneNumber: phoneNumber.trim(),
      receiverName: receiverName.trim(),
      couponCode: appliedCouponCode,
      discountAmount,
    });

    // Deduct stock and increment soldCount
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: {
          stock: -item.quantity,
          soldCount: item.quantity,
        },
      });
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // If Stripe payment method, create checkout session
    if (paymentMethod === 'stripe') {
      let checkoutUrl = '';

      if (stripe) {
        // Create actual Stripe Checkout Session
        const lineItems = [
          {
            price_data: {
              currency: 'vnd',
              product_data: {
                name: `Đơn hàng #${order._id.toString().substring(order._id.toString().length - 8).toUpperCase()}`,
                description: 'Thanh toán đơn hàng thiết bị di động tại Mobile Store',
              },
              unit_amount: finalTotalAmount,
            },
            quantity: 1,
          },
        ];

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: `${env.corsOrigin}/checkout-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
          cancel_url: `${env.corsOrigin}/checkout-cancel?order_id=${order._id}`,
          metadata: {
            orderId: order._id.toString(),
          },
        });

        checkoutUrl = session.url;
        order.stripeSessionId = session.id;
        await order.save();
      } else {
        // Mock Mode: redirect to success directly
        checkoutUrl = `${env.corsOrigin}/checkout-success?session_id=mock_session_id_${order._id}&order_id=${order._id}`;
      }

      return res.status(201).json({
        message: 'Đơn hàng được khởi tạo. Đang chuyển hướng sang cổng thanh toán...',
        order,
        checkoutUrl,
      });
    }

    res.status(201).json({
      message: 'Đặt hàng thành công.',
      order,
    });
  } catch (error) {
    next(error);
  }
}

async function listCustomerOrders(req, res, next) {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name brand images price');

    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

async function getOrderDetail(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Mã đơn hàng không hợp lệ.' });
    }

    const order = await Order.findOne({
      _id: id,
      customer: req.user._id,
    }).populate('items.product', 'name brand images price');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
}

async function searchOrder(req, res, next) {
  try {
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp mã đơn hàng tra cứu.',
      });
    }

    let cleanedId = orderId.trim();
    if (cleanedId.startsWith('#')) {
      cleanedId = cleanedId.substring(1);
    }
    if (cleanedId.toUpperCase().startsWith('DH-')) {
      cleanedId = cleanedId.substring(3);
    }

    if (!mongoose.Types.ObjectId.isValid(cleanedId)) {
      return res.status(400).json({ message: 'Mã đơn hàng tra cứu không hợp lệ.' });
    }

    const order = await Order.findById(cleanedId)
      .populate('items.product', 'name brand images price');

    if (!order) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn hàng khớp với mã cung cấp.',
      });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
}

async function listAllOrders(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const { status, keyword } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (keyword) {
      const keywordTrim = keyword.trim();
      const keywordRegex = new RegExp(keywordTrim, 'i');
      const orConditions = [
        { receiverName: keywordRegex },
        { phoneNumber: keywordRegex },
      ];

      let cleanedId = keywordTrim;
      if (cleanedId.startsWith('#')) cleanedId = cleanedId.substring(1);
      if (cleanedId.toUpperCase().startsWith('DH-')) cleanedId = cleanedId.substring(3);

      if (mongoose.Types.ObjectId.isValid(cleanedId)) {
        orConditions.push({ _id: cleanedId });
      }

      filter.$or = orConditions;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('customer', 'fullName email')
      .populate('items.product', 'name brand price images');

    res.json({
      items: orders,
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

async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ.' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate('customer', 'fullName email')
      .populate('items.product', 'name brand price images');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    res.json({
      message: 'Cập nhật trạng thái đơn hàng thành công.',
      order,
    });
  } catch (error) {
    next(error);
  }
}

async function verifyStripePayment(req, res, next) {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Mã đơn hàng không hợp lệ.' });
    }

    if (!sessionId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mã phiên Stripe.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    // Mock Mode
    if (sessionId.startsWith('mock_session_id_')) {
      order.paymentStatus = 'paid';
      order.status = 'confirmed'; // confirm order automatically upon receipt of payment
      await order.save();
      return res.json({
        message: 'Thanh toán (giả lập) thành công!',
        order,
      });
    }

    if (!stripe) {
      return res.status(400).json({ message: 'Cổng thanh toán Stripe chưa được cấu hình.' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.stripeSessionId = sessionId;
      await order.save();

      return res.json({
        message: 'Thanh toán trực tuyến qua Stripe thành công!',
        order,
      });
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      return res.status(400).json({
        message: 'Thanh toán chưa hoàn tất hoặc thất bại.',
        paymentStatus: session.payment_status,
      });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  listCustomerOrders,
  getOrderDetail,
  searchOrder,
  listAllOrders,
  updateOrderStatus,
  verifyStripePayment,
};
