const Order = require('../../models/Order.model');
const Ingredient = require('../../models/Ingredient.model');
const Reservation = require('../../models/Reservation.model');
const MenuItem = require('../../models/MenuItem.model');
const User = require('../../models/User.model');
const Supplier = require('../../models/Supplier.model');
const Table = require('../../models/Table.model');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/statistics
// @access  Private/Admin
exports.getStatistics = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // --- Core Totals ---
        const totalUsers = await User.countDocuments();
        const totalSuppliers = await Supplier.countDocuments();
        const totalTables = await Table.countDocuments();
        const totalMenuItems = await MenuItem.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalReservations = await Reservation.countDocuments();

        // --- Revenue & Order Performance ---
        // Total Orders Today
        const totalOrdersToday = await Order.countDocuments({
            createdAt: { $gte: today }
        });

        // Total Revenue (All time from PAID orders)
        const allPaidOrders = await Order.find({ status: 'PAID' }, 'total');
        const totalRevenue = allPaidOrders.reduce((acc, order) => acc + (order.total || 0), 0);

        // Revenue Today
        const ordersToday = await Order.find({
            createdAt: { $gte: today },
            status: 'PAID'
        }, 'total');
        const totalRevenueToday = ordersToday.reduce((acc, order) => acc + (order.total || 0), 0);

        // --- Inventory & Maintenance ---
        // Low Stock Items
        const lowStockItems = await Ingredient.find({
            $expr: { $lte: ['$quantity', '$minLevel'] }
        });

        // Active Reservations (Today onwards)
        const activeReservations = await Reservation.countDocuments({
            status: 'BOOKED',
            startAt: { $gte: today }
        });

        // --- Aggregation for Charts (Last 7 Days) ---
        // Generate last 7 days array with 0 defaults
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            d.setHours(0, 0, 0, 0);
            return {
                _id: d.toISOString().split('T')[0],
                day: d.toLocaleDateString('en', { weekday: 'short' }),
                dailyRevenue: 0,
                orderCount: 0
            };
        });

        // Get actual revenue data
        const revenueData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo },
                    status: { $ne: 'CANCELLED' }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    dailyRevenue: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, "$total", 0] } },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Merge actual data into 7-day array
        revenueData.forEach(r => {
            const day = last7Days.find(d => d._id === r._id);
            if (day) {
                day.dailyRevenue = r.dailyRevenue;
                day.orderCount = r.orderCount;
            }
        });

        // Popular Menu Items (Top 5 by Quantity in Orders)
        // Aggregating from Order items
        const popularMenuItems = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.menuItemId",
                    name: { $first: "$items.name" },
                    totalSold: { $sum: "$items.qty" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalUsers,
                    totalSuppliers,
                    totalTables,
                    totalMenuItems,
                    totalOrders,
                    totalReservations,
                    totalRevenue,
                    totalOrdersToday,
                    totalRevenueToday,
                    lowStockCount: lowStockItems.length,
                    activeReservations
                },
                lowStockItems,
                popularMenuItems,
                chartData: last7Days
            }
        });
    } catch (err) {
        next(err);
    }
};


// @desc    Get revenue analytics for different time ranges
// @route   GET /api/dashboard/revenue-analytics?days=7
// @access  Private/Admin
exports.getRevenueAnalytics = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 7;
        
        // Generate date array with 0 defaults
        const dateArray = Array.from({ length: days }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            d.setHours(0, 0, 0, 0);
            return {
                date: d.toISOString().split('T')[0],
                displayDate: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
                day: d.toLocaleDateString('en', { weekday: 'short' }),
                revenue: 0,
                orderCount: 0
            };
        });

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Get actual revenue data
        const revenueData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: 'PAID'
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$total" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Merge actual data into date array
        revenueData.forEach(r => {
            const day = dateArray.find(d => d.date === r._id);
            if (day) {
                day.revenue = r.revenue;
                day.orderCount = r.orderCount;
            }
        });

        // Calculate summary stats
        const totalRevenue = dateArray.reduce((sum, d) => sum + d.revenue, 0);
        const avgPerDay = totalRevenue / days;
        const peakDay = dateArray.reduce((max, d) => d.revenue > max.revenue ? d : max, dateArray[0]);

        res.status(200).json({
            success: true,
            data: {
                chartData: dateArray,
                summary: {
                    totalRevenue,
                    avgPerDay,
                    peakDay: {
                        date: peakDay.displayDate,
                        revenue: peakDay.revenue
                    }
                }
            }
        });
    } catch (err) {
        next(err);
    }
};
