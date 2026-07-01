const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function getOrCreateCart(customerId) {
  let cart = await Cart.findOne({ customer: customerId });
  if (!cart) {
    cart = await Cart.create({ customer: customerId, items: [] });
  }
  return cart;
}

async function populateCartItems(cart) {
  return cart.populate({
    path: 'items.product',
    select: 'name price salePrice images stock slug status brand',
  });
}

async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const populatedCart = await populateCartItems(cart);
    res.json({ cart: populatedCart });
  } catch (error) {
    next(error);
  }
}

async function addCartItem(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ID sản phẩm.' });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Số lượng phải là số nguyên lớn hơn 0.' });
    }

    const product = await Product.findOne({ _id: productId, status: 'active' });
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại hoặc đã bị ngừng bán.' });
    }

    const cart = await getOrCreateCart(req.user._id);
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + qty;
      if (newQuantity > product.stock) {
        return res.status(400).json({
          message: `Không thể thêm. Tồn kho sản phẩm chỉ còn ${product.stock} sản phẩm.`,
        });
      }
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      if (qty > product.stock) {
        return res.status(400).json({
          message: `Không thể thêm. Tồn kho sản phẩm chỉ còn ${product.stock} sản phẩm.`,
        });
      }
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    const populatedCart = await populateCartItems(cart);
    res.status(200).json({
      message: 'Đã thêm sản phẩm vào giỏ hàng.',
      cart: populatedCart,
    });
  } catch (error) {
    next(error);
  }
}

async function updateCartItem(req, res, next) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ message: 'Vui lòng cung cấp số lượng cập nhật.' });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Số lượng phải là số nguyên lớn hơn 0.' });
    }

    const product = await Product.findOne({ _id: productId, status: 'active' });
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại hoặc đã bị ngừng bán.' });
    }

    if (qty > product.stock) {
      return res.status(400).json({
        message: `Số lượng yêu cầu vượt quá tồn kho hiện tại (${product.stock} sản phẩm).`,
      });
    }

    const cart = await getOrCreateCart(req.user._id);
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng.' });
    }

    cart.items[itemIndex].quantity = qty;
    await cart.save();

    const populatedCart = await populateCartItems(cart);
    res.json({
      message: 'Đã cập nhật số lượng sản phẩm.',
      cart: populatedCart,
    });
  } catch (error) {
    next(error);
  }
}

async function removeCartItem(req, res, next) {
  try {
    const { productId } = req.params;

    const cart = await getOrCreateCart(req.user._id);
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng.' });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    const populatedCart = await populateCartItems(cart);
    res.json({
      message: 'Đã xóa sản phẩm khỏi giỏ hàng.',
      cart: populatedCart,
    });
  } catch (error) {
    next(error);
  }
}

async function clearCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();

    res.json({
      message: 'Đã xóa toàn bộ sản phẩm khỏi giỏ hàng.',
      cart,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};
