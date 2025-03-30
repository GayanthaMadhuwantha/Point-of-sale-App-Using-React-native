import React, { useState, useEffect, useContext } from "react";
import {
    View, Text, TouchableOpacity, FlatList, Platform, StyleSheet, Dimensions, TouchableWithoutFeedback, Modal, ScrollView,RefreshControl
} from "react-native";
import { getSalesMetrics, getTopSellingItems, getSalesTrends, fetchOrders } from "../services/database";
import { BarChart, LineChart } from "react-native-chart-kit";
import { LanguageContext } from '../LanguageContext';
import i18n from '../i18n';
import BackgroundWrapper from "../components/BackgroundWrapper";

const ReportScreen = () => {
    const [metrics, setMetrics] = useState({ orderCount: 0, totalSales: 0, avgOrderPrice: 0 });
    const [topSellingItems, setTopSellingItems] = useState([]);
    const [selectedRange, setSelectedRange] = useState("Today");
    const [salesTrends, setSalesTrends] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orders, setOrders] = useState([]); 
    const { language, updateLanguage } = useContext(LanguageContext);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchReportData(selectedRange);
        fetchOrderHistory(selectedRange);
    }, [selectedRange]);

    // For "Today", return current date's ISO string; for Weekly/Monthly subtract appropriate duration
    const getDateRange = (range) => {
        const now = new Date(); // Get current date-time
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

    const onRefresh = () => {
        setRefreshing(true);
        fetchReportData(selectedRange);
        fetchOrderHistory(selectedRange);
        setTimeout(() => {
            setRefreshing(false);
        }, 2000); // Simulating API fetch
    };


    const fetchOrderHistory = async (range) => {
        const orderData = await fetchOrders(range);
        setOrders(orderData);
    };

    const fetchReportData = async (range) => {
        const dateRange = getDateRange(range);
        const metricsData = await getSalesMetrics(dateRange);
        const topItems = await getTopSellingItems(dateRange);
        const trendsData = await getSalesTrends(dateRange);
        setMetrics(metricsData);
        setTopSellingItems(topItems);
        setSalesTrends(trendsData);
    };

    const handleViewReceipt = (order) => {
        setSelectedOrder(order);
        setModalVisible(true);
    };

    const handleHideReceipt = () => {
        setModalVisible(false);
    };

    // Render the static header content as ListHeaderComponent
    const ListHeader = () => (
        <View>
            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                {["Today", "Weekly", "Monthly"].map((range) => (
                    <TouchableOpacity
                        key={range}
                        style={[
                            styles.filterButton,
                            selectedRange === range && styles.selectedFilterButton
                        ]}
                        onPress={() => setSelectedRange(range)}
                    >
                        <Text style={[
                            styles.filterText,
                            selectedRange === range && styles.selectedFilterText
                        ]}>
                            {range}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Metrics Cards */}
            <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{i18n.t("rs")} {metrics.totalSales}</Text>
                    <Text style={styles.metricLabel}>{i18n.t("total_sales")}</Text>
                </View>
                <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{metrics.orderCount}</Text>
                    <Text style={styles.metricLabel}>{i18n.t("total_orders")}</Text>
                </View>
                <View style={styles.metricCard}>
                    <Text style={styles.metricValue}>{i18n.t("rs")} {metrics.avgOrderPrice?.toFixed(2) || '0.00'}</Text>
                    <Text style={styles.metricLabel}>{i18n.t('avg_order')}</Text>
                </View>
            </View>

            {/* Sales Chart - Sales Overview */}
            {topSellingItems.length > 0 && (
                <View style={styles.chartContainer}>
                    <Text style={styles.sectionTitle}>{i18n.t("sales_overview")}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <BarChart
                            data={{
                                labels: topSellingItems.map(item => item.name),
                                datasets: [{ data: topSellingItems.map(item => item.totalQuantity) }]
                            }}
                            width={Dimensions.get("window").width - 40}
                            height={220}
                            yAxisLabel=""
                            chartConfig={{
                                backgroundGradientFrom: "rgb(235, 227, 255)",
                                backgroundGradientTo: "rgb(235, 227, 255)",
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(129, 82, 247, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                style: { borderRadius: 10 }
                            }}
                            style={styles.chart}
                        />
                    </ScrollView>
                </View>


            )}

            {/* Sales Trends Chart */}
            {salesTrends.length > 0 && (
                <View style={styles.chartContainer}>
                    <Text style={styles.sectionTitle}>{i18n.t("sales_trends")}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <LineChart
                            data={{
                                labels: salesTrends.map(item => item.date),
                                datasets: [{ data: salesTrends.map(item => item.totalSales) }]
                            }}
                            width={Dimensions.get("window").width - 40}
                            height={220}
                            yAxisLabel=""
                            chartConfig={{
                                backgroundGradientFrom: "rgb(235, 227, 255)",
                                backgroundGradientTo: "rgb(235, 227, 255)",
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(129, 82, 247, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                style: { borderRadius: 10 }
                            }}
                            style={styles.chart}
                        />
                    </ScrollView>
                </View>
            )}

            {/* Top Selling Products List */}
            <View style={styles.listContainer}>
                <Text style={styles.sectionTitle}>{i18n.t("top_selling_products")}</Text>
                <FlatList
                    data={topSellingItems}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemQuantity}>{item.totalQuantity}{i18n.t('sold')}</Text>
                        </View>
                    )}
                    scrollEnabled={false} // disable inner scroll for header content
                />
            </View>

            {/* Title for Previous Orders */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{i18n.t('previous_orders')}</Text>
        </View>
    );

    return (
        <BackgroundWrapper>
        <ScrollView style={styles.container}  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}>
            <FlatList
                data={orders}
                keyExtractor={(item) => String(item.orderId)}
                renderItem={({ item }) => (
                    <View style={styles.orderRow}>
                        <Text style={styles.orderText}> #{item.orderId}</Text>
                        <Text style={styles.orderText}>{i18n.t('rs')}. {item.total}</Text>
                        <Text style={styles.orderText}>{item.created_at}</Text>
                        <TouchableOpacity style={styles.viewButton} onPress={() => handleViewReceipt(item)}>
                            <Text style={styles.viewButtonText}>{i18n.t('view')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListHeaderComponent={ListHeader}
                contentContainerStyle={{ paddingBottom: 20 }}
            />

            {/* Receipt Modal */}
            <Modal visible={modalVisible} animationType="fade" transparent>
                <TouchableWithoutFeedback onPress={handleHideReceipt}>

                    <View style={styles.modalContainer}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                {selectedOrder && (
                                    <>
                                        <Text style={styles.receiptTitle}>{i18n.t('receipt')}</Text>
                                        <Text>- - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</Text>
                                        <Text>{i18n.t('order')} #: {selectedOrder.orderId}</Text>

                                        <Text>{i18n.t('date')}: {new Date(selectedOrder.createdAt).toLocaleString()}</Text>

                                        <Text>{i18n.t('customer')}: {i18n.t('cash_customer')}</Text>
                                        <Text>- - - - - - - - - - - - - - - - - - - - - - - - - - - - -</Text>
                                        <View style={styles.line} />

                                        {/* Order Items */}
                                        <View style={styles.receiptContainer}>
                                            <View style={styles.receiptHeader}>
                                                <Text style={styles.headerText}>{i18n.t('item')}</Text>
                                                <Text style={styles.headerText}>{i18n.t('quantity')}</Text>
                                                <Text style={styles.headerText}>{i18n.t('price')}({i18n.t('rs')})</Text>
                                            </View>
                                            {selectedOrder.items.map((item, index) => (
                                                <View key={index} style={styles.receiptRow}>
                                                    <Text style={styles.itemText}>{item.name}</Text>
                                                    <Text style={styles.itemText}>{item.quantity}</Text>
                                                    <Text style={styles.itemText}>{item.price.toFixed(2)}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        <View style={styles.line} />

                                        {/* Total */}
                                        <Text>- - - - - - - - - - - - - - - - - - - - - - - - - - - - -</Text>
                                        <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>{i18n.t('total')}: {i18n.t} {selectedOrder.total.toFixed(2)}</Text>
                                        <Text>- - - - - - - - - - - - - - - - - - - - - - - - - - - - -</Text>
                                        <View style={styles.line} />

                                        <Text style={{ textAlign: 'center', fontWeight: 'bold', }}>{i18n.t('thank_you_come_again')}</Text>

                                        <TouchableOpacity style={styles.closeButton} onPress={handleHideReceipt}>
                                            <Text style={{ textAlign: 'center', fontWeight: 'bold', marginTop: 10 }}>{i18n.t('close')}</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </ScrollView>
        </BackgroundWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        
    },


    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    selectedFilterButton: {
        backgroundColor: "rgb(255, 227, 238)",
    },
    filterText: {
        color: "rgb(247, 82, 132)",
        fontWeight: '500',
    },
    selectedFilterText: {
        color: 'rgb(247, 82, 132)',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,

    },
    metricCard: {
        backgroundColor: "rgb(255, 227, 238)",

        flex: 1,
        marginHorizontal: 4,
        padding: 16,
        borderRadius: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    receiptTitle: {
        fontWeight: 'bold',
        textAlign: 'center'
    },
    metricValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 14,
        color: '#666',
    },
    chartContainer: {
        backgroundColor: "rgb(255, 227, 238)",

        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    chart: {
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    listContainer: {
        backgroundColor: "rgb(255, 227, 238)",
        borderRadius: 12,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
                marginBottom: 1,
            },
        }),
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemName: {
        fontSize: 16,
        color: '#333',
    },
    itemQuantity: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
    modalContent: { backgroundColor: "rgb(255, 227, 238)", padding: 15, borderRadius: 10, width: 250, },
    modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
    orderRow: { flexDirection: "row", justifyContent: "space-between", padding: 10, borderBottomWidth: 1 },
    orderText: { fontSize: 14 },
    viewButton: { backgroundColor: "rgb(247, 82, 137)", padding: 5, borderRadius: 50, width: 60 },
    viewButtonText: {
        color: "#fff", textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    receiptContainer: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        margin: 10,

    },
    receiptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 5,
        marginBottom: 5,
    },
    headerText: {
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
    },
    itemText: {
        flex: 1,
        textAlign: 'center',
    },
    receiptContainer: {

        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,

    },
    receiptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 5,
        marginBottom: 5,
    },
    headerText: {
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
    },
    itemText: {
        flex: 1,
        textAlign: 'center',
    },
});

export default ReportScreen;
