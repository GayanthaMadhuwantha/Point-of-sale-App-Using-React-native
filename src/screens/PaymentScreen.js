import React, { useState, useEffect, useContext } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Modal,
    ScrollView, Dimensions, TouchableWithoutFeedback, Alert, RefreshControl,KeyboardAvoidingView,Platform
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LanguageContext } from '../LanguageContext';
import i18n from '../i18n'
import AddCustomerModal from "./AddCustomerModal";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import {
    checkDuePayments,
    fetchOrderspayment,
    fetchPaymentDetails,getCustomers, deleteCustomer
} from "../services/database";
import PaymentModal from "./PaymentModal";
import BackgroundWrapper from "../components/BackgroundWrapper";

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

const PaymentScreen = () => {
    const navigation = useNavigation();
    const [orders, setOrders] = useState([]);
    const [completeModalVisible, setCompleteModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
  
    const [paymentDetails, setPaymentDetails] = useState(null);
    
    const [formState, setFormState] = useState({
        amountGiven: "",
        creditPeriod: "",
        creditEndDate: new Date(),
        checkNumber: "",
        checkEndDate: new Date(),
        customCash: "",
        customCheck: "",
        customCredit: ""
    });
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const { language, updateLanguage } = useContext(LanguageContext);
    const [refreshing, setRefreshing] = useState(false);


    // Fetch customers from DB
    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        const data = await getCustomers();
        console.log(data);
        setCustomers(data);
        setFilteredCustomers(data);
    };

    // Handle search
    const handleSearch = (query) => {
        setSearchQuery(query);
        const filtered = customers.filter(customer =>
            customer.shop_name.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredCustomers(filtered);
    };

    const handleDelete = (customerId) => {
        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this customer?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        // Wrap async operation inside a function
                        deleteCustomer(customerId).then(() => {
                            fetchCustomers(); // Refresh list
                        }).catch(error => {
                            console.error("Error deleting customer:", error);
                        });
                    }
                }
            ]
        );
    };


    // Handle edit button click
    const handleEdit = (customer) => {
        console.log(customer);
        setSelectedCustomer(customer);

        setAddCustomerModalVisible(true);
    };


    useEffect(() => {
        const loadData = async () => {
            const ordersData = await fetchOrderspayment();
            setOrders(ordersData);
            await checkDuePayments();
        };
        loadData();
    }, []);

    useEffect(() => {
        if (formState.creditPeriod) {
            const newDate = new Date();
            newDate.setMonth(newDate.getMonth() + parseInt(formState.creditPeriod));
            setFormState(prev => ({ ...prev, creditEndDate: newDate }));
        }
    }, [formState.creditPeriod]);

   
    const handleViewPayment = async (orderId) => {
        setSelectedOrderId(orderId);
        const details = await fetchPaymentDetails(orderId);
        if (details) {
            setPaymentDetails(details);
            setViewModalVisible(true);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchCustomers();
        setTimeout(() => {
            setRefreshing(false);
        }, 2000); // Simulating API fetch
    };

    const renderOrderItem = ({ item }) => (
        <View style={styles.orderItem}>
            <View style={styles.orderInfo}>
                <Text style={styles.orderId}>{i18n.t('order')} #{item.order_id}</Text>
                <Text>{i18n.t('shop_name')}{item.shop_name}</Text>
                <Text style={styles.orderTotal}>{i18n.t('rs')} {item.total}</Text>
            </View>
            <TouchableWithoutFeedback>
                <TouchableOpacity pointerEvents="auto"
                    style={item.payment_type ? styles.viewBtn : styles.completeBtn}
                    onPress={() => item.payment_type ?
                        handleViewPayment(item.order_id) :
                        (setSelectedOrderId(item.order_id), setCompleteModalVisible(true))
                    }
                >
                    <Text style={styles.btnText}>
                        {item.payment_type ? i18n.t("view_payment") : i18n.t("complete")}
                    </Text>
                </TouchableOpacity></TouchableWithoutFeedback>
        </View>
    );

    return (
         <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.container}
            >
         <BackgroundWrapper>       
        <ScrollView style={styles.scrollContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>


            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={24} color="#999" style={styles.searchIcon} />
                <TextInput placeholder="Search customers..." placeholderTextColor="#666" value={searchQuery} onChangeText={handleSearch} style={styles.searchInput} />
            </View>
            <View style={{ maxHeight: 250, }} showsHorizontalScrollIndicator={false}>
                <FlatList
                    data={filteredCustomers}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.customerItem}>


                            <View style={styles.actionButtons}>
                                <Text style={styles.customerText}>{item.shop_name}</Text>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => handleEdit(item)}
                                >
                                    <Icon name="edit" size={25} color="black" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(item.id)}
                                >
                                    <Icon name="delete" size={25} color="black" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            </View>

            <View style={{ marginTop: 20 }} showsHorizontalScrollIndicator={false}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Orders</Text>
               
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.order_id.toString()}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.listContainer}
                />
            </View>



            {selectedCustomer ? (
                <AddCustomerModal
                    visible={addCustomerModalVisible}
                    customer={selectedCustomer}
                    onClose={() => setAddCustomerModalVisible(false)}
                    refreshCustomers={fetchCustomers}
                />
            ) : (
                <AddCustomerModal
                    visible={addCustomerModalVisible}
                    customer={null}
                    onClose={() => setAddCustomerModalVisible(false)}
                    refreshCustomers={fetchCustomers}
                />
            )}


            <PaymentModal visible={completeModalVisible} onClose={() => setCompleteModalVisible(false)} orderId={selectedOrderId} setOrders={setOrders} />




            {/* Payment Modal */}



            {/* View Payment Modal */}
            <Modal
                visible={viewModalVisible}
                transparent
                animationType="fade"
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>{i18n.t('payment_details')} #{selectedOrderId}</Text>

                        {paymentDetails ? (
                            <View style={styles.detailsContainer}>
                                <DetailRow label="Method" value={paymentDetails.payment_type} key={paymentDetails.id} />
                                <DetailRow label="Shop" value={paymentDetails.shop_name} />

                                {paymentDetails.payment_type === "Cash" && (
                                    <DetailRow label="Amount" value={`Rs.${paymentDetails.cash_amount}`} />
                                )}

                                {paymentDetails.payment_type === "Credit" && (
                                    <>
                                        <DetailRow label="Period" value={`${paymentDetails.credit_period} months`} />
                                        <DetailRow label="End Date" value={paymentDetails.credit_due_date} />
                                    </>
                                )}

                                {paymentDetails.payment_type === "Check" && (
                                    <>
                                        <DetailRow label="Check No" value={paymentDetails.check_number} />
                                        <DetailRow label="Expiry" value={paymentDetails.check_due_date} />
                                    </>
                                )}

                                {paymentDetails.payment_type === "Custom" && (
                                    <>
                                        <DetailRow label="Cash" value={`Rs.${paymentDetails.cash_amount}`} />
                                        <DetailRow label="Check" value={`Rs.${paymentDetails.check_amount}`} />
                                        <DetailRow label="Check No" value={`${paymentDetails.check_number}`} />
                                        <DetailRow label="Expiry" value={`${paymentDetails.check_due_date}`} />
                                        <DetailRow label="Credit" value={`Rs.${paymentDetails.credit_amount}`} />
                                        <DetailRow label="Period" value={`${paymentDetails.credit_period} months`} />
                                        <DetailRow label="End Date" value={`${paymentDetails.credit_due_date}`} />
                                    </>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.loadingText}>{i18n.t('loading_details...')}</Text>
                        )}

                        <TouchableOpacity style={{ padding: 10, borderRadius: 50 }} onPress={() => setViewModalVisible(false)}>
                            <Text style={{ color: 'black', fontWeight: 'bold', textAlign: 'center', fontSize: 16 }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            
        </ScrollView><TouchableOpacity style={styles.floatingButton} onPress={() => setAddCustomerModalVisible(true)}>
                <FontAwesome6 name="plus" size={28} color="white" />
            </TouchableOpacity>
         </BackgroundWrapper>   
        </KeyboardAvoidingView>
        
    );
};

const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    scrollContainer: {
        padding: width * 0.04,
    
      },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
justifyContent:'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 50,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        marginTop: 10

    },
    searchIcon: {
        marginLeft: 12,
    },
    searchInput: {
        flex: 1,
        padding: 9,
        fontSize: 14,
        color: '#2d2d2d',
    },
    header: {
        fontSize: isTablet ? 18 : 18,
        fontWeight: 'bold',
        textAlign: 'left',
        marginVertical: height * 0.02,
        color: '#2c3e50'
    },
    customerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Aligns items to the edges
        alignItems: 'center', // Centers items vertically
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',

    },
    floatingButton: {
       position:'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: "black",
        padding: 15,
        paddingLeft:18,
        paddingRight:18,
        borderRadius: 50,
        flexDirection: "row",
        alignItems: "center",
    
    },
    floatingButtonText: {
        floatcolor: "#fff",
        marginLeft: 5,
        fontWeight: "bold",
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center', // Centers text and buttons vertically
        flex: 1, // Allows the text to take available space
        gap: 15,
    },
    customerText: {
        fontSize: 16,
        flex: 1, // Allows the text to take available space
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editButton: {
        marginLeft: 10, // Adds space between buttons
    },
    deleteButton: {
        marginLeft: 10, // Adds space between buttons
    },

    horizontalLine: {
        width: '100%', // Full width
        // Thickness of the line
        backgroundColor: 'black', // Color of the line
        marginVertical: 10, // Space above and below the line
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    margintext: {
        marginTop: 10,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: "rgb(255, 227, 238)",
        borderRadius: 15,
        padding: width * 0.04,
        marginBottom: height * 0.01,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,

    },
    orderInfo: {
        flex: 1,
        marginRight: 10
    },
    orderId: {
        fontSize: isTablet ? 18 : 16,
        color: '#34495e',
        marginBottom: 5
    },
    orderTotal: {
        fontSize: isTablet ? 16 : 14,
        color: '#7f8c8d',
        fontWeight: '500'
    },
    dateText: {

        borderRadius: 50,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'left'

    },
    completeBtn: {
        backgroundColor: '#f96363',
        paddingVertical: height * 0.01,
        paddingHorizontal: width * 0.04,
        borderRadius: 50
    },
    viewBtn: {
        backgroundColor: 'black',
        paddingVertical: height * 0.01,
        paddingHorizontal: width * 0.04,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center'
    },
    btnText: {
        color: 'white',
        fontSize: isTablet ? 16 : 14,
        fontWeight: '600'
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: "rgb(255, 227, 238)",
        width: isTablet ? '70%' : '90%',
        maxWidth: 600,
        borderRadius: 12,
        padding: width * 0.05
    },
    modalHeader: {
        fontSize: isTablet ? 22 : 18,
        fontWeight: '700',
        marginBottom: height * 0.02,
        color: '#2c3e50',
        textAlign: 'center'
    },
    picker: {
        backgroundColor: '#ecf0f1',
        borderRadius: 50,
        marginBottom: height * 0.02
    },
    input: {
        borderColor: '#bdc3c7',
        borderBottomWidth: 1,

        paddingHorizontal: 15,
        marginBottom: height * 0.01,
        fontSize: 14,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: height * 0.02
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5
    },
    cancelButton: {

        borderRadius: 50,
    },
    saveButton: {

        borderRadius: 50,
    },
    closeButton: {
        backgroundColor: 'black',
        padding: 20,
        borderRadius: 50,

    },
    cabuttonText: {
        color: "rgb(245, 61, 61)",
        fontWeight: '600',
        fontSize: 16
    },
    sabuttonText: {
        color: 'black',
        fontWeight: '600',
        fontSize: 16
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: '#ecf0f1'
    },
    detailLabel: {
        fontSize: 16,
        color: '#7f8c8d',
        fontWeight: '500'
    },
    detailValue: {
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '600'
    },
    loadingText: {
        textAlign: 'center',
        color: '#95a5a6',
        fontSize: 16,
        marginVertical: 20
    },


});


export default PaymentScreen;

