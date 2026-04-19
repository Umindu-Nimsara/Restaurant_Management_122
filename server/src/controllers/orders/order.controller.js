const Order = require('../../models/Order.model');
const MenuItem = require('../../models/MenuItem.model');
const Table = require('../../models/Table.model');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
    try {
        let query = {};
        if (req.query.myOrders === 'true') {
            query.staffId = req.user.id;
        } else if (req.user && req.user.role === 'CUSTOMER') {
            query.staffId = req.user.id;
        }

        const orders = await Order.find(query)
            .populate('staffId', 'name')
            .populate('tableId', 'tableNumber')
            .populate('items.menuItemId', 'name price');
        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('staffId', 'name')
            .populate('tableId', 'tableNumber')
            .populate('items.menuItemId', 'name price');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private (Waiter/Admin)
exports.createOrder = async (req, res, next) => {
    try {
        const { tableId, items, paymentMethod, orderType, customerName, customerPhone } = req.body;

        if (orderType === 'Takeaway') {
            if (!customerName || !customerPhone) {
                return res.status(400).json({
                    success: false,
                    error: 'Customer name and phone are required for Takeaway orders'
                });
            }
        } else {
            // Default to Dine-In
            if (!tableId) {
                return res.status(400).json({
                    success: false,
                    error: 'Table ID is required for Dine-In orders'
                });
            }

            // Prevent Double Booking
            const existingOrder = await Order.findOne({
                tableId,
                status: { $in: ['PENDING', 'COOKING', 'SERVED'] }
            });

            if (existingOrder) {
                return res.status(400).json({
                    success: false,
                    error: 'Table is already occupied with an active order'
                });
            }
        }

        let subtotal = 0;
        const orderItems = [];

        // Process items and calculate total
        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItemId);
            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    error: `Menu item not found: ${item.menuItemId}`
                });
            }

            const itemTotal = menuItem.price * item.qty;
            subtotal += itemTotal;

            orderItems.push({
                menuItemId: item.menuItemId,
                name: menuItem.name,
                price: menuItem.price,
                qty: item.qty,
                note: item.note
            });
        }

        const total = subtotal; 

        const order = await Order.create({
            orderType: orderType || 'Dine-In',
            customerName,
            customerPhone,
            tableId: tableId || undefined,
            staffId: req.body.staffId || req.user.id,
            items: orderItems,
            subtotal,
            total,
            paymentMethod,
            notes: req.body.notes
        });

        // Automatically mark the Table as OCCUPIED
        if (order.tableId) {
            await Table.findByIdAndUpdate(order.tableId, { status: 'OCCUPIED' });
        }

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private (Waiter/Admin)
exports.updateOrder = async (req, res, next) => {
    try {
        const { tableId, items, staffId, notes, orderType, customerName, customerPhone } = req.body;
        let order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Only allowed to edit if status is PENDING
        if (order.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: 'Orders can only be edited while in PENDING status'
            });
        }

        let subtotal = 0;
        const orderItems = [];

        // Process items and calculate total
        if (items) {
            for (const item of items) {
                const menuItem = await MenuItem.findById(item.menuItemId);
                if (!menuItem) {
                    return res.status(404).json({
                        success: false,
                        error: `Menu item not found: ${item.menuItemId}`
                    });
                }

                const itemTotal = menuItem.price * item.qty;
                subtotal += itemTotal;

                orderItems.push({
                    menuItemId: item.menuItemId,
                    name: menuItem.name,
                    price: menuItem.price,
                    qty: item.qty,
                    note: item.note
                });
            }
        }

        const total = subtotal;

        order = await Order.findByIdAndUpdate(req.params.id, {
            orderType: orderType || order.orderType,
            customerName: customerName !== undefined ? customerName : order.customerName,
            customerPhone: customerPhone !== undefined ? customerPhone : order.customerPhone,
            tableId: tableId !== undefined ? tableId : order.tableId,
            staffId: staffId || order.staffId,
            items: items ? orderItems : order.items,
            subtotal: items ? subtotal : order.subtotal,
            total: items ? total : order.total,
            notes: notes !== undefined ? notes : order.notes
        }, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin/Chef/Waiter)
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, {
            new: true,
            runValidators: true
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Auto-free Table logic if Order concludes
        if (order.tableId && ['PAID', 'CANCELLED'].includes(status)) {
            const activeOrders = await Order.find({
                tableId: order.tableId,
                status: { $in: ['PENDING', 'COOKING', 'SERVED'] }
            });
            
            if (activeOrders.length === 0) {
                await Table.findByIdAndUpdate(order.tableId, { status: 'AVAILABLE' });
            }
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (err) {
        next(err);
    }
};
