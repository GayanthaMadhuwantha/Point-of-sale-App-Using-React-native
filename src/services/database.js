import { Alert } from "react-native";
import * as SQLite from 'expo-sqlite';
import * as Notifications from "expo-notifications";

// Open Database Asynchronously
export const openDatabase = async () => {
    const db = await SQLite.openDatabaseAsync('possxc.db');

    // Enable Write-Ahead Logging for better performance
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // Create the Products Table if it does not exist
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      initial_price REAL NULL,
      stock INTEGER NULL DEFAULT 0,
      image TEXT  NOT NULL,
      state TEXT NOT NULL
    );
  `);

    await db.execAsync(`
     CREATE TABLE IF NOT EXISTS grn (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        total REAL NOT NULL
    );
`);


    await db.execAsync(`
     CREATE TABLE IF NOT EXISTS grn_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grn_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        total REAL NOT NULL
       
    );
`);

    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS orders(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER ,
    total REAL NOT NULL,
    initial_total REAL NOT NULL, 
    amount_given REAL NOT NULL, 
    change_amount REAL NOT NULL,
    created_at TEXT NOT NULL
    );
    `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS orderitems(
        order_id INTEGER NOT NULL, 
        product_id INTEGER NOT NULL, 
        quantity INTEGER NOT NULL, 
        price REAL NOT NULL
        );

        `);
    await db.execAsync(`
             CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shop_name TEXT NOT NULL,
                address TEXT NOT NULL,
                telephone TEXT NOT NULL,
                registration_no TEXT DEFAULT "",
                state TEXT NULL
            );
        `);

    await db.execAsync(`
            CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            shop_id TEXT NOT NULL, 
            payment_type TEXT NULL,
            credit_period INTEGER NULL, 
            credit_due_date TEXT NULL,
            check_number TEXT NULL, 
            check_due_date TEXT NULL, 
            cash_amount REAL NULL,
            check_amount REAL NULL,
            credit_amount REAL NULL
        );
`)



    return db;
};

// Function to insert a new product
export const addProduct = async (name, price, intialPrice, stock, imageUri) => {
    try {
        const db = await openDatabase();
        const result = await db.runAsync('INSERT INTO products (name, price, initial_price, stock, image, state) VALUES (?, ?, ?, ?, ?, ?)', [name, price, intialPrice, stock, imageUri, 'yes']);
        return result.lastInsertRowId;
    } catch (error) {
        console.error("Error fetching orders:", error);
    }
};

// Function to get all products
export const fetchProducts = async () => {
    const db = await openDatabase();
    const products = await db.getAllAsync('SELECT * FROM products WHERE state = "yes"');
    return products;
};

// Function to update a product
export const updateProduct = async (id, name, price, intialPrice, stock) => {
    const db = await openDatabase();
    await db.runAsync('UPDATE products SET name = ?, price = ?, initial_price = ?, stock = ? WHERE id = ?', [name, price, intialPrice, stock, id]);
};

// Function to delete a product
export const deleteProduct = async (id) => {
    const db = await openDatabase();
    await db.runAsync('UPDATE products SET state = "no" WHERE id = ?', [id]);
};
export const saveOrder = async (order, shopId) => {
    console.log("Saving order:", order, "Shop ID:", shopId);

    const db = await openDatabase();
    const createdAt = new Date().toISOString();

    await db.runAsync("BEGIN TRANSACTION"); // Start transaction

    try {
        // Insert order
        const result = await db.runAsync(
            "INSERT INTO orders (shop_id, total, initial_total, amount_given, change_amount, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            [shopId, order.total, order.intialTotal, order.amountGiven, order.change, createdAt]
        );

        const orderId = result.lastInsertRowId; // Ensure correct property
        console.log("Generated Order ID:", orderId);

        if (!orderId) {
            throw new Error("Order ID is null or undefined!");
        }

        // ✅ Insert order_id and shop_id into payments table
        await db.runAsync(
            "INSERT INTO payments (order_id, shop_id) VALUES (?, ?)",
            [orderId, shopId]
        );

        console.log("Inserted order_id and shop_id into payments table.");

        // Insert order items and update stock
        for (const item of order.items) {
            await db.runAsync(
                "INSERT INTO orderitems (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                [orderId, item.productId, item.quantity, item.price]
            );

            await db.runAsync(
                "UPDATE products SET stock = stock - ? WHERE id = ?",
                [item.quantity, item.productId]
            );
        }

        await db.runAsync("COMMIT"); // Commit transaction if all queries succeed
        return orderId;
    } catch (error) {
        await db.runAsync("ROLLBACK"); // Rollback transaction on error
        console.error("Error saving order:", error);
        return null;
    }
};




// Function to get key sales metrics
export const getSalesMetrics = async (dateRange) => {
    const db = await openDatabase();
    let query = `SELECT COUNT(id) as orderCount, SUM(total) as totalSales, AVG(total) as avgOrderPrice FROM orders`;
    let params = [];

    if (dateRange) {
        query += ` WHERE created_at >= ?`;
        params.push(dateRange);
    }

    const result = await db.getFirstAsync(query, params);
    console.log("Sales Metrics:", result);
    return result || { orderCount: 0, totalSales: 0, avgOrderPrice: 0 };
};

// Function to get top 5 selling items
export const getTopSellingItems = async (dateRange) => {
    const db = await openDatabase();
    let query = `
        SELECT p.name, SUM(o.quantity) as totalQuantity
        FROM orderitems o
        JOIN products p ON o.product_id = p.id
    `;
    let params = [];

    if (dateRange) {
        query += ` JOIN orders ord ON o.order_id = ord.id WHERE ord.created_at >= ?`;
        params.push(dateRange);
    }

    query += ` GROUP BY o.product_id ORDER BY totalQuantity DESC LIMIT 5;`;

    return await db.getAllAsync(query, params);
};

export const getSalesTrends = async (dateRange) => {
    const db = await openDatabase();
    let query = `
        SELECT DATE(created_at) as date, SUM(total) as totalSales
        FROM orders
    `;
    let params = [];

    if (dateRange) {
        query += ` WHERE created_at >= ?`;
        params.push(dateRange);
    }

    query += ` GROUP BY DATE(created_at) ORDER BY date ASC;`;

    return await db.getAllAsync(query, params);
};


export const fetchOrders = async (selectedRange) => {
    try {
        const db = await openDatabase();
        let query = `
            SELECT o.id AS orderId, o.total, o.amount_given, o.change_amount, o.created_at,
                   oi.product_id, p.name AS productName, oi.quantity, oi.price
            FROM orders o
            JOIN orderitems oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
        `;
        let params = [];

        if (selectedRange) {
            const dateRange = getDateRange(selectedRange);
            query += " WHERE o.created_at >= ?";
            params.push(dateRange);
        }

        //  query += " ORDER BY o.created_at DESC"; // Sorting by newest orders first
        //onsole.log("Fetched Orders:", orderData);

        const orders = await db.getAllAsync(query, params);

        // Group orders by orderId
        const groupedOrders = {};
        orders.forEach(order => {
            if (!groupedOrders[order.orderId]) {
                groupedOrders[order.orderId] = {
                    orderId: order.orderId,
                    total: order.total,
                    amountGiven: order.amount_given,
                    change: order.change_amount,
                    createdAt: order.created_at,
                    items: []
                };
            }
            groupedOrders[order.orderId].items.push({
                productId: order.product_id,
                name: order.productName,
                quantity: order.quantity,
                price: order.price
            });
        });

        return Object.values(groupedOrders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
};

const getDateRange = (range) => {
    const now = new Date(); 

    if (range === "Today") {
        return now.toISOString(); // Return today's date
    }

    if (range === "Weekly") {
        const lastWeek = new Date(now); // Create a new date instance
        lastWeek.setDate(lastWeek.getDate() - 7);
        return lastWeek.toISOString();
    } 
    else if (range === "Monthly") {
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return lastMonth.toISOString();
    }

    return now.toISOString(); // Default: Return today's date
};



export const saveGRN = async (grnItems) => {
    console.log("Saving GRN:", grnItems);

    const db = await openDatabase();
    const createdAt = new Date().toISOString();

    const totalAmount = grnItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const result = await db.runAsync(
        "INSERT INTO grn (date, total) VALUES (?, ?)",
        [createdAt, totalAmount]
    );

    const grnId = result.lastInsertRowId;
    console.log("Generated GRN ID:", grnId);

    if (!grnId) {
        console.error("GRN ID is null or undefined!");
        return null;
    }

    for (const item of grnItems) {
        await db.runAsync(
            "INSERT INTO grn_items (grn_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)",
            [grnId, item.productId, item.quantity, item.price, item.total]
        );

        await db.runAsync(
            "UPDATE products SET stock = stock + ? WHERE id = ?",
            [item.quantity, item.productId]
        );
    }

    return grnId;
};

export const getAllGRNs = async () => {
    const db = await openDatabase();
    const result = await db.getAllAsync("SELECT * FROM grn ORDER BY date DESC");
    return result;
};

export const getGRNDetails = async (grnId) => {
    const db = await openDatabase();

    const grn = await db.getFirstAsync("SELECT * FROM grn WHERE id = ?", [grnId]);
    const items = await db.getAllAsync(
        `SELECT grn_items.*, products.name AS product_name 
         FROM grn_items 
         JOIN products ON grn_items.product_id = products.id 
         WHERE grn_items.grn_id = ?`,
        [grnId]
    );

    return { grn, items };
};

export const deleteGRN = async (grnId) => {
    console.log("Deleting GRN:", grnId);

    const db = await openDatabase();

    // Get all items to rollback stock
    const items = await db.getAllAsync("SELECT product_id, quantity FROM grn_items WHERE grn_id = ?", [grnId]);

    // Rollback stock
    for (const item of items) {
        await db.runAsync("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.product_id]);
    }

    // Delete records
    await db.runAsync("DELETE FROM grn_items WHERE grn_id = ?", [grnId]);
    await db.runAsync("DELETE FROM grn WHERE id = ?", [grnId]);

    console.log(`GRN #${grnId} deleted.`);
};

export const getCustomers = async () => {
    const db = await openDatabase();
    return await db.getAllAsync("SELECT id, shop_name, address, telephone, registration_no FROM customers WHERE state = ?",["yes"]);
};

export const deleteCustomer = async (customerId) => {
    const db = await openDatabase();
    await db.runAsync("UPDATE customers set state = ? WHERE id = ?", ["no", customerId]);
};

export const updateCustomer = async (id, shopName, address, telephone, registrationNo) => {
    const db = await openDatabase();
    await db.runAsync(
        "UPDATE customers SET shop_name = ?, address = ?, telephone = ?, registration_no = ? WHERE id = ?",
        [shopName, address, telephone, registrationNo, id]
    );
};



export const updateGRN = async (grnId, updatedItems) => {
    console.log("Updating GRN:", grnId, updatedItems);

    const db = await openDatabase();

    // Get previous GRN items for stock rollback
    const oldItems = await db.getAllAsync("SELECT product_id, quantity FROM grn_items WHERE grn_id = ?", [grnId]);

    // Rollback old stock
    for (const item of oldItems) {
        await db.runAsync("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.product_id]);
    }

    // Delete old GRN items
    await db.runAsync("DELETE FROM grn_items WHERE grn_id = ?", [grnId]);

    // Insert new GRN items
    for (const item of updatedItems) {
        await db.runAsync(
            "INSERT INTO grn_items (grn_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)",
            [grnId, item.productId, item.quantity, item.price, item.total]
        );

        await db.runAsync(
            "UPDATE products SET stock = stock + ? WHERE id = ?",
            [item.quantity, item.productId]
        );
    }

    // Update total amount
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await db.runAsync("UPDATE grn SET total = ? WHERE id = ?", [totalAmount, grnId]);

    console.log(`GRN #${grnId} updated.`);
};

export const checkDuePayments = async () => {
    try {
        const db = await openDatabase();
        const today = new Date().toISOString().split("T")[0];

        const result = await db.getAllAsync(
            `SELECT order_id, payment_type, credit_due_date, check_due_date FROM payments 
         WHERE (credit_due_date <= ? OR check_due_date <= ?) 
         AND payment_type IN ('Credit', 'Check')`,
            [today, today]
        );

        const duePayments = [];

        for (const payment of result) {
            const formatDate = (dateStr) => dateStr.split("T")[0]; // Remove time
            let message = "";
            let dueDate = "";

            if (payment.payment_type === "Credit" && formatDate(payment.credit_due_date) <= today) {
                message = `Order #${payment.order_id} has an overdue credit payment!`;
                dueDate = payment.credit_due_date;
            } else if (payment.payment_type === "Check" && formatDate(payment.check_due_date) <= today) {
                message = `Order #${payment.order_id} has an overdue check payment!`;
                dueDate = payment.check_due_date;
            }

            if (message) {
                duePayments.push({ message, dueDate });

                await Notifications.scheduleNotificationAsync({
                    content: { title: "Payment Due Alert!", body: message },
                    trigger: { seconds: 1 }, // Send immediately
                });
            }
        }

        return duePayments;
    } catch (error) {
        console.error("Error checking due payments:", error);
        return [];
    }
};



export const fetchOrderspayment = async () => {
    try {
        const db = await openDatabase(); // Open SQLite database
        const result = await db.getAllAsync(
            `SELECT o.id AS order_id, o.total, p.payment_type, c.shop_name
             FROM orders o 
             LEFT JOIN payments p ON o.id = p.order_id 
             LEFT JOIN customers c ON o.shop_id = c.id
             ORDER BY p.payment_type IS NULL DESC, o.id DESC`
        );
        return result;
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
};

export const savePayment = async ({
    orderId,
    paymentType,
    amountGiven,
    creditPeriod,
    creditEndDate,
    checkNumber,
    checkEndDate,
    customCash,
    customCheck,
    customCredit,
}) => {
    if (!paymentType) {
        Alert.alert("Error", "Please enter all required fields.");
        return false;
    }

    try {
        const db = await openDatabase(); // Open the database

        let finalAmount = 0;
        if (paymentType === "Cash") {
            finalAmount = parseFloat(customCash);
        } else if (paymentType === "Credit") {
            finalAmount = parseFloat(customCredit);
        } else if (paymentType === "Check") {
            finalAmount = parseFloat(customCheck);
        } else if (paymentType === "Custom") {
            finalAmount = parseFloat(customCash) + parseFloat(customCheck) + parseFloat(customCredit);
        }
        console.log("payment Details:", orderId, paymentType, finalAmount, creditPeriod, creditEndDate, checkNumber, checkEndDate, customCash, customCheck, customCredit);
        // Insert payment details into the database
        await db.runAsync(
            `UPDATE payments SET payment_type = ?, credit_period = ?, credit_due_date = ?, check_number = ?, check_due_date = ?, cash_amount = ?, check_amount = ?, credit_amount = ? 
            WHERE order_id = ?`,
            [

                paymentType,
                paymentType === "Credit" ? creditPeriod : null,
                paymentType === "Credit" ? creditEndDate : null,
                paymentType === "Check" ? checkNumber : null,
                paymentType === "Check" ? checkEndDate : null,
                paymentType === "Custom" ? customCash : null,
                paymentType === "Custom" ? customCheck : null,
                paymentType === "Custom" ? customCredit : null,
                orderId

            ]
        );

        Alert.alert("Success", "Payment recorded successfully!");
        return true; // Indicate success
    } catch (error) {
        console.error("Error saving payment:", error);
        return false;
    }
};

export const fetchPaymentDetails = async (orderId) => {
    try {
        const db = await openDatabase(); // Open database

        const result = await db.getFirstAsync(
            `SELECT p.*, c.shop_name, o.id, o.total FROM payments p 
            LEFT JOIN orders o ON p.order_id = o.id
            LEFT JOIN customers c ON p.shop_id = c.id
            WHERE p.order_id = ?`,
            [orderId]
        );

        return result || null; // Return payment details or null if not found
    } catch (error) {
        console.error("Error fetching payment:", error);
        return null;
    }
};

export const addcustomer = async (shopName, address, telephone, registrationNo) => {
    try {
        const db = await openDatabase();
        await db.runAsync(
            `INSERT INTO customers (shop_name, address, telephone, registration_no, state) VALUES (?, ?, ?, ?, ?)`,
            [shopName, address, telephone, registrationNo, "yes"]
        );

    } catch (error) {
        console.error("Error adding customer:", error);
    }
};

export const getbalance = async (customerId) => {
    try {
        const db = await openDatabase();
        const result = await db.getFirstAsync(
            `SELECT SUM(CASE WHEN payment_type = 'Cash' THEN cash_amount ELSE 0 END) AS cash_amount,
            SUM(CASE WHEN payment_type = 'Check' THEN check_amount ELSE 0 END) AS check_amount,
            SUM(CASE WHEN payment_type = 'Credit' THEN credit_amount ELSE 0 END) AS credit_amount
            FROM payments WHERE shop_id = ?`,
            [customerId]
        );
        console.log("Balance:", result);
        return result || null;
    } catch (error) {
        console.error("Error fetching balance:", error);
        return null;
    }
};

export const getpaymenthistory = async (customerId) => {
    try {
        const db = await openDatabase();
        const result = await db.getAllAsync(
            `SELECT p.*, c.shop_name, o.total FROM payments p 
            LEFT JOIN orders o ON p.order_id = o.id
            LEFT JOIN customers c ON p.shop_id = c.id
            WHERE p.shop_id = ?`,
            [customerId]
        );
        return result || null;
    } catch (error) {
        console.error("Error fetching payment history:", error);
        return null;
    }
};


export const fetchFinancialSummary = async () => {
    const db = await openDatabase();
    const result = await db.getAllAsync(
        `SELECT COALESCE(SUM(total), 0) AS revenue, 
                COALESCE(SUM(total - initial_total), 0) AS profit 
         FROM orders`
    );
    return result[0] || { revenue: 0, profit: 0 };  // Ensure fallback object
};

export const fetchPaymentSummary = async () => {
    const db = await openDatabase();
    const result = await db.getAllAsync(
        `SELECT COALESCE(SUM(credit_amount), 0) AS credit, 
                COALESCE(SUM(cash_amount), 0) AS cash, 
                COALESCE(SUM(check_amount), 0) AS checks 
         FROM payments`
    );
    console.log("Payment Summary:", result);
    return result[0] || { credit: 0, cash: 0, checks: 0 }; // Ensure fallback object
};

export const getAllPayments = async () => {
    const db = await openDatabase();
    const result = await db.getAllAsync("SELECT * FROM payments");
    console.log("All Payments:", result);
    return result;
};




