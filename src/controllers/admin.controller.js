const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

async function getDashboardStats(req, res, next) {
  try {
    const { filterType = 'all', date, month, year } = req.query;

    const now = new Date();
    let start, end, compStart, compEnd;
    let labelPeriod = '';
    let showTrend = true;

    if (filterType === 'day') {
      const baseDate = date ? new Date(date) : new Date();
      if (isNaN(baseDate.getTime())) {
        return res.status(400).json({ message: 'Ngày lọc không hợp lệ.' });
      }

      start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
      end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

      // Previous day
      compStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      compEnd = new Date(end.getTime() - 24 * 60 * 60 * 1000);

      labelPeriod = `Ngày ${start.getDate().toString().padStart(2, '0')}/${(start.getMonth() + 1).toString().padStart(2, '0')}/${start.getFullYear()}`;
    } else if (filterType === 'month') {
      const selYear = parseInt(year) || now.getFullYear();
      const selMonth = parseInt(month) || (now.getMonth() + 1);

      start = new Date(selYear, selMonth - 1, 1, 0, 0, 0, 0);
      end = new Date(selYear, selMonth, 0, 23, 59, 59, 999);

      // Previous month
      compStart = new Date(selYear, selMonth - 2, 1, 0, 0, 0, 0);
      compEnd = new Date(selYear, selMonth - 1, 0, 23, 59, 59, 999);

      labelPeriod = `Tháng ${selMonth}/${selYear}`;
    } else if (filterType === 'year') {
      const selYear = parseInt(year) || now.getFullYear();

      start = new Date(selYear, 0, 1, 0, 0, 0, 0);
      end = new Date(selYear, 12, 0, 23, 59, 59, 999);

      // Previous year
      compStart = new Date(selYear - 1, 0, 1, 0, 0, 0, 0);
      compEnd = new Date(selYear - 1, 12, 0, 23, 59, 59, 999);

      labelPeriod = `Năm ${selYear}`;
    } else {
      // All time
      start = new Date(2000, 0, 1);
      end = new Date(2100, 0, 1);
      showTrend = false;
      labelPeriod = 'Tất cả thời gian';
    }

    // 1. Calculate Period Revenue (Completed/Confirmed/Shipping orders in start -> end)
    const ordersInPeriod = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $in: ['confirmed', 'shipping', 'completed'] },
    });
    const periodRevenue = ordersInPeriod.reduce((sum, o) => sum + o.totalAmount, 0);

    // 2. Count new orders in period
    const totalOrdersInPeriod = await Order.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    // 3. Count low stock products (snapshot stat, does not depend on dates)
    const lowStockCount = await Product.countDocuments({
      status: 'active',
      stock: { $lte: 5 },
    });

    // 4. Count total customers (snapshot stat)
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // 5. Total revenue accumulated historically
    const allCompletedOrdersAllTime = await Order.find({
      status: { $in: ['confirmed', 'shipping', 'completed'] },
    });
    const totalRevenueAccumulated = allCompletedOrdersAllTime.reduce((sum, o) => sum + o.totalAmount, 0);

    // 6. Cancellation rate in selected period
    const totalOrdersAllTimeInPeriod = await Order.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });
    const totalCancelledOrdersInPeriod = await Order.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: 'cancelled',
    });
    const cancellationRate = totalOrdersAllTimeInPeriod > 0
      ? (totalCancelledOrdersInPeriod / totalOrdersAllTimeInPeriod) * 100
      : 0;

    // 7. Calculate trends if applicable
    let revenueTrend = null;
    let ordersTrend = null;

    if (showTrend) {
      // Comparison period revenue
      const compOrders = await Order.find({
        createdAt: { $gte: compStart, $lte: compEnd },
        status: { $in: ['confirmed', 'shipping', 'completed'] },
      });
      const compRevenue = compOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      if (compRevenue > 0) {
        revenueTrend = (((periodRevenue - compRevenue) / compRevenue) * 100).toFixed(1);
      } else if (periodRevenue > 0) {
        revenueTrend = '100.0';
      } else {
        revenueTrend = '0.0';
      }

      // Comparison period orders count
      const compOrdersCount = await Order.countDocuments({
        createdAt: { $gte: compStart, $lte: compEnd },
      });

      if (compOrdersCount > 0) {
        ordersTrend = (((totalOrdersInPeriod - compOrdersCount) / compOrdersCount) * 100).toFixed(1);
      } else if (totalOrdersInPeriod > 0) {
        ordersTrend = '100.0';
      } else {
        ordersTrend = '0.0';
      }
    }

    // 8. Calculate Top 5 best selling products in the selected period (or fallback to overall top if none sold)
    const topProductsAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['confirmed', 'shipping', 'completed'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          soldCount: { $sum: '$items.quantity' },
        },
      },
      { $sort: { soldCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
    ]);

    const topProducts = topProductsAgg.map((item) => ({
      _id: item.productDetails._id,
      name: item.productDetails.name,
      brand: item.productDetails.brand,
      price: item.productDetails.price,
      salePrice: item.productDetails.salePrice,
      images: item.productDetails.images,
      stock: item.productDetails.stock,
      soldCount: item.soldCount,
    }));

    if (topProducts.length === 0) {
      const overallTop = await Product.find({ status: 'active' })
        .sort({ soldCount: -1 })
        .limit(5)
        .select('name brand price salePrice images soldCount stock');
      topProducts.push(...overallTop);
    }

    // 9. Dynamic Chart Data
    const chartData = [];

    if (filterType === 'day') {
      // 6 days leading up to selected day
      for (let i = 5; i >= 0; i--) {
        const dayDate = new Date(start.getTime() - i * 24 * 60 * 60 * 1000);
        const startOfDay = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59, 999);

        const dOrders = await Order.find({
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ['confirmed', 'shipping', 'completed'] },
        });
        const dRevenue = dOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const label = `${dayDate.getDate().toString().padStart(2, '0')}/${(dayDate.getMonth() + 1).toString().padStart(2, '0')}`;

        chartData.push({
          month: label,
          rawVal: dRevenue,
          value: dRevenue > 1000000 ? `${(dRevenue / 1000000).toFixed(1)}M đ` : `${dRevenue.toLocaleString('vi-VN')} đ`,
        });
      }
    } else if (filterType === 'year') {
      // 12 months of selected year
      const selYear = parseInt(year) || now.getFullYear();
      for (let m = 0; m < 12; m++) {
        const startOfMonth = new Date(selYear, m, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(selYear, m + 1, 0, 23, 59, 59, 999);

        const mOrders = await Order.find({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: { $in: ['confirmed', 'shipping', 'completed'] },
        });
        const mRevenue = mOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const label = `T${m + 1}`;

        chartData.push({
          month: label,
          rawVal: mRevenue,
          value: mRevenue > 1000000 ? `${(mRevenue / 1000000).toFixed(1)}M đ` : `${mRevenue.toLocaleString('vi-VN')} đ`,
        });
      }
    } else {
      // 'month' or 'all': 6 months leading up to selected month (or current month)
      const baseMonthDate = filterType === 'month' ? start : new Date(now.getFullYear(), now.getMonth(), 1);
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(baseMonthDate.getFullYear(), baseMonthDate.getMonth() - i, 1);
        const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 0, 0, 0, 0);
        const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const mOrders = await Order.find({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: { $in: ['confirmed', 'shipping', 'completed'] },
        });
        const mRevenue = mOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const label = `T${monthDate.getMonth() + 1}/${monthDate.getFullYear().toString().substring(2)}`;

        chartData.push({
          month: label,
          rawVal: mRevenue,
          value: mRevenue > 1000000 ? `${(mRevenue / 1000000).toFixed(1)}M đ` : `${mRevenue.toLocaleString('vi-VN')} đ`,
        });
      }
    }

    // Chart heights
    const maxVal = Math.max(...chartData.map((d) => d.rawVal), 1);
    chartData.forEach((d) => {
      d.height = `${Math.round((d.rawVal / maxVal) * 100)}%`;
    });

    // 10. Recent activities (overall recent system operations)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('customer', 'fullName');

    const recentUsers = await User.find({ role: 'customer' })
      .sort({ createdAt: -1 })
      .limit(3);

    const recentProducts = await Product.find()
      .sort({ updatedAt: -1 })
      .limit(3);

    const activities = [];

    recentOrders.forEach((o) => {
      activities.push({
        id: `order-${o._id}`,
        type: 'order',
        text: `Đơn hàng mới #DH-${o._id.toString().substring(16).toUpperCase()} trị giá ${o.totalAmount.toLocaleString('vi-VN')}đ được tạo bởi ${o.receiverName}.`,
        timeRaw: o.createdAt,
      });
    });

    recentUsers.forEach((u) => {
      activities.push({
        id: `user-${u._id}`,
        type: 'user',
        text: `Người dùng mới ${u.fullName} (${u.email}) đã đăng ký tài khoản thành công.`,
        timeRaw: u.createdAt,
      });
    });

    recentProducts.forEach((p) => {
      activities.push({
        id: `product-${p._id}`,
        type: 'product',
        text: `Sản phẩm ${p.name} đã được cập nhật kho hàng (Tồn: ${p.stock}).`,
        timeRaw: p.updatedAt,
      });
    });

    activities.sort((a, b) => b.timeRaw - a.timeRaw);
    const recentActivities = activities.slice(0, 5).map((act) => {
      const diffMs = now - act.timeRaw;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeText = 'Vừa xong';
      if (diffDays > 0) {
        timeText = `${diffDays} ngày trước`;
      } else if (diffHours > 0) {
        timeText = `${diffHours} giờ trước`;
      } else if (diffMins > 0) {
        timeText = `${diffMins} phút trước`;
      }

      return {
        id: act.id,
        type: act.type,
        text: act.text,
        time: timeText,
      };
    });

    res.json({
      stats: {
        monthlyRevenue: periodRevenue, // Maintain name for client compatibility or rename
        revenueTrend,
        newOrdersCount: totalOrdersInPeriod,
        ordersTrend,
        lowStockCount,
        totalCustomers,
        totalRevenueAccumulated,
        cancellationRate: cancellationRate.toFixed(1),
        labelPeriod,
      },
      revenueChart: chartData,
      topProducts,
      recentActivities,
    });
  } catch (error) {
    next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const { role, keyword } = req.query;

    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (keyword) {
      const keywordRegex = new RegExp(keyword.trim(), 'i');
      filter.$or = [
        { fullName: keywordRegex },
        { email: keywordRegex },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      items: users,
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

async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Bạn không thể tự thay đổi quyền của chính mình.' });
    }

    if (!['admin', 'customer'].includes(role)) {
      return res.status(400).json({ message: 'Quyền hạn yêu cầu không hợp lệ.' });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    res.json({
      message: 'Cập nhật quyền thành viên thành công.',
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Bạn không thể tự khóa tài khoản của chính mình.' });
    }

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái yêu cầu không hợp lệ.' });
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    res.json({
      message: status === 'blocked' ? 'Đã khóa tài khoản người dùng.' : 'Đã mở khóa tài khoản người dùng.',
      user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  listUsers,
  updateUserRole,
  toggleUserStatus,
};
