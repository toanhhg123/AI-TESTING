const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cod', 'momo', 'visa', 'bank_transfer'],
      default: 'cod',
    },
    shippingAddress: {
      type: String,
      required: [true, 'Địa chỉ giao hàng không được để trống.'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Số điện thoại nhận hàng không được để trống.'],
      trim: true,
    },
    receiverName: {
      type: String,
      required: [true, 'Tên người nhận không được để trống.'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
