const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');

async function createOrder(req, res, next) {
  try {
    const { shippingAddress, phoneNumber, receiverName, paymentMethod = 'cod' } = req.body;

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

    // Create the order
    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      totalAmount,
      paymentMethod,
      shippingAddress: shippingAddress.trim(),
      phoneNumber: phoneNumber.trim(),
      receiverName: receiverName.trim(),
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
    const { orderId, phoneNumber } = req.query;

    if (!orderId || !phoneNumber) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp đầy đủ mã đơn hàng và số điện thoại tra cứu.',
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

    const order = await Order.findOne({
      _id: cleanedId,
      phoneNumber: phoneNumber.trim(),
    }).populate('items.product', 'name brand images price');

    if (!order) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn hàng khớp với thông tin tra cứu.',
      });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  listCustomerOrders,
  getOrderDetail,
  searchOrder,
};
