const Product = require('../models/Product');

async function createReview(req, res, next) {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    if (rating === undefined || comment === undefined) {
      return res.status(400).json({ message: 'Vui lòng cung cấp điểm đánh giá và nhận xét.' });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5.' });
    }

    if (!comment.trim()) {
      return res.status(400).json({ message: 'Nhận xét không được để trống.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    const newReview = {
      customer: req.user._id,
      customerName: req.user.fullName,
      rating: numericRating,
      comment: comment.trim(),
      createdAt: new Date(),
    };

    product.reviews.push(newReview);

    const totalRating = product.reviews.reduce((sum, rev) => sum + rev.rating, 0);
    product.averageRating = parseFloat((totalRating / product.reviews.length).toFixed(1));

    await product.save();

    res.status(201).json({
      message: 'Thêm đánh giá thành công.',
      reviews: product.reviews,
      averageRating: product.averageRating,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReview,
};
