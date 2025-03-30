import React, { useState, useEffect, useContext } from "react";
import {
    View, Text, FlatList, TouchableOpacity, TextInput, Alert, StyleSheet,
    TouchableWithoutFeedback, RefreshControl, ImageBackground, Animated, Modal, Image, Dimensions
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { fetchProducts, saveOrder, getCustomers } from "../services/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import i18n from '../i18n';
import { useNavigation } from "@react-navigation/native"
import { LanguageContext } from '../LanguageContext';
import AddCustomerModal from "./AddCustomerModal";
import FlashMessage, { showMessage } from 'react-native-flash-message';
import LoadingOverlay from "../components/LoadingOverlay";
import PaymentModal from "./PaymentModal";
import ProductModal from "./ProductModal";
import BackgroundWrapper from "../components/BackgroundWrapper";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768; // 


const DashboardScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [order, setOrder] = useState([]);
    const [total, setTotal] = useState(0);
    const [intialTotal, setInitialTotal] = useState(0);
    const [amountGiven, setAmountGiven] = useState("");
    const [change, setChange] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const [logo, setLogo] = useState(null);
    const [companyName, setCompanyName] = useState("");
    const [address, setAddress] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isPrinting, setIsPrinting] = useState(false);
    const [logoBase64, setLogoBase64] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [customerId, setCustomerId] = useState("");
    const { language, updateLanguage } = useContext(LanguageContext);
    const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [completeModalVisible, setCompleteModalVisible] = useState(false);
    const [showOrderSection, setShowOrderSection] = useState(false);
    const [productModalVisible, setProductModalVisible] = useState(false);
    const slideAnim = useState(new Animated.Value(-300))[0];


    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        const data = await getCustomers();
        setCustomers(data);
    };



    const loadProducts = async () => {
        try {

            setIsLoading(true);
            const data = await fetchProducts();

            setProducts(data);
            setFilteredProducts(data);



        } finally {
            setIsLoading(false);

        }



    };



    useEffect(() => {
        const loadSettings = async () => {
            try {
                const storedLogo = await AsyncStorage.getItem("restaurant_logo");
                const currentOrderId = await AsyncStorage.getItem("current_order_id") ? await AsyncStorage.getItem("current_order_id") : 0;

                const storedCompanyName = await AsyncStorage.getItem("company_name");
                const storedAddress = await AsyncStorage.getItem("company_address");
                const storedPhone = await AsyncStorage.getItem("company_phone");

                if (storedLogo) {
                    setLogo(storedLogo);
                    convertToBase64(storedLogo); // Convert to Base64
                }
                setCurrentOrderId(currentOrderId);
                if (storedCompanyName) setCompanyName(storedCompanyName);
                if (storedAddress) setAddress(storedAddress);
                if (storedPhone) setPhoneNumber(storedPhone);
            } catch (error) {
                console.error("Error loading settings:", error);
            }
        };

        loadSettings();
    }, []);

    const convertToBase64 = async (imageUri) => {
        try {
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            setLogoBase64(`data:image/png;base64,${base64}`); // Store Base64 version
        } catch (error) {
            console.error("Error converting image to Base64:", error);
        }
    };

    const toggleOrderSection = () => {
        Animated.timing(slideAnim, {
            toValue: showOrderSection ? -300 : 0, // Slide out if open, slide in if closed
            duration: 300,
            useNativeDriver: false,
        }).start();
        setShowOrderSection(!showOrderSection);
    };


    const onRefresh = () => {
        setRefreshing(true);
        loadProducts();
        fetchCustomers();
        setTimeout(() => {
            setRefreshing(false);
        }, 2000); // Simulating API fetch
    };


    useEffect(() => {
        loadProducts();
        fetchCustomers();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", loadProducts);
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        if (products.length > 0) {
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    }, [searchQuery, products]);

    // Function to add product to the order
    const removeFromOrder = (productId) => {
        const itemToRemove = order.find(item => item.id === productId);

        if (itemToRemove) {
            // Subtract the total price of the removed item from the total
            setTotal(prevTotal => prevTotal - (itemToRemove.quantity * itemToRemove.price));
            setInitialTotal(prevTotal => prevTotal - (itemToRemove.quantity * itemToRemove.initial_price));

            // Remove the item from the order
            setOrder(order.filter(item => item.id !== productId));
        }
    };

    const updateQuantity = (productId, newQuantity) => {
        // Convert input to an integer and ensure it's at least 1
        const quantity = parseInt(newQuantity) || 1;

        setOrder(order.map((item) =>
            item.id === productId ? { ...item, quantity } : item
        ));

        // Update total price
        const newTotal = order.reduce((sum, item) =>
            item.id === productId ? sum + (item.price * quantity) - (item.price * item.quantity)
                : sum, total
        );
        const newinitialTotal = order.reduce((sum, item) =>
            item.id === productId ? sum + (item.initial_price * quantity) - (item.initial_price * item.quantity)
                : sum, intialTotal
        );

        setTotal(newTotal);
        setInitialTotal(newinitialTotal);
    };




    const addToOrder = (product) => {
        const existingItem = order.find((item) => item.id === product.id);

        if (existingItem) {
            setOrder(order.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setOrder([...order, { ...product, quantity: 1 }]);
        }

        // Update total price
        setTotal((prevTotal) => prevTotal + product.price);
        setInitialTotal((prevTotal) => prevTotal + product.initial_price);
    };


    // Auto-calculate change when amount given is updated
    useEffect(() => {
        const amount = parseFloat(amountGiven);
        if (!isNaN(amount)) {
            setChange(amount - total);
        }
    }, [amountGiven, total]);


    const clearOrder = () => {
        setOrder([]);
        setTotal(0);
        setInitialTotal(0);
    };

    const printReceipt = async (order) => {
        try {
            setIsPrinting(true); // Disable button before printing

            const receiptHTML = `
            <html>
              <head>
                <style>
                  body { font-size: 12px; text-align: center; font-family: Arial, sans-serif; width: 80mm; margin: 0 auto; }
                  h2 { margin-bottom: 5px; }
                  img { width: 50px; margin-bottom: 5px; }
                  .line { border-top: 1px dashed black; margin: 5px 0; }
                  table { width: 100%; margin-top: 10px; }
                  th, td { text-align: left; padding: 5px; font-size: 12px; }
                  .total { font-weight: bold; font-size: 14px; }
                  .footer { margin-top: 10px; font-size: 10px; }
                </style>
              </head>
              <body>
                ${logoBase64 ? `<img src="${logoBase64}" alt="Company Logo" />` : ""}
                <h5>${companyName || "Company Name"}</h5>
                <p style="text-align:center;">${address || "Company Address"}</p>
                <p>${i18n.t('tep')}: ${phoneNumber || "N/A"}</p>
                <div class="line"></div>
                <p><strong>${i18n.t('order')} #: ${order.orderId}</strong></p>
                <p>${i18n.t('date')}: ${new Date().toLocaleString()}</p>
                <p>${i18n.t('customer')}: ${i18n.t('cash_customer')}</p>
                <div class="line"></div>
                <table>
                  <tr>
                    <th>${i18n.t('item')}</th>
                    <th>${i18n.t('quantity')}</th>
                    <th>${i18n.t('price')}</th>
                  </tr>
                  ${order.items
                    .map(
                        (item) => `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${i18n.t('rs')}${item.price.toFixed(2)}</td>
                      </tr>
                    `
                    )
                    .join("")}
                </table>
                <div class="line"></div>
                <p class="total">${i18n.t('total')}: ${i18n.t('rs')}${order.total.toFixed(2)}</p>
                <div class="line"></div>
                <p>${i18n.t('thank_you_for_dining')}</p>
                <p style="text-align:center;">** This is your receipt **</p>
                <p style="text-align:center;">Please keep it for returns</p>
                <p style="text-align:center;">Software By ChoxSoft.</p>
                <p style="text-align:center;">0771168439/0764162891.</p>
                <p>${new Date().toLocaleString()}</p>
              </body>
            </html>
          `;

            await Print.printAsync({ html: receiptHTML, printerUrl: null });

        } catch (error) {
            console.error("Printing error:", error);
        } finally {
            setIsPrinting(false); // Re-enable button after printing
        }
    };


    const resetOrder = () => {
        setOrder([]);
        setTotal(0);
        setAmountGiven("");
        setChange(0);
    };


    // Function to process payment and save order
    const processPayment = async () => {
        if (order.length === 0) {
            Alert.alert("Error", "No items in the order.");
            return;
        }

        const amount = parseFloat(amountGiven);
        if (isNaN(amount) || amount < total) {
            Alert.alert("Invalid Payment", "Amount should be greater than or equal to total.");
            return;
        }

        if (!customerId || customerId === '') {
            showMessage({
                message: 'Warning',
                description: 'Please select a customer.',
                type: 'warning',
                duration: 3000,
            });
            return;
        }

        setIsProcessing(true); // Show loading animation (modal)

        const newOrder = {
            total,
            intialTotal,
            amountGiven: amount,
            change: amount - total,
            items: order.map((item) => ({
                productId: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
            })),
        };

        const orderId = await saveOrder(newOrder, customerId);

        if (orderId) {
            setCurrentOrderId(orderId);
            newOrder.orderId = orderId;

            try {
                await printReceipt(newOrder); // Wait for print to complete
            } catch (error) {
                console.error("Printing failed:", error);
            } finally {
                showMessage({
                    message: null,
                    description: (
                        <>
                            <Text style={{ color: "#fff" }}>Successfully saved the order.</Text>
                            {"  "}
                            <Text onPress={() => setCompleteModalVisible(true)} style={{ color: "black", fontWeight: "bold" }}>
                                Complete Payment
                            </Text>
                        </>
                    ),
                    type: "success",
                    duration: 7000,
                    autoHide: true, // Message disappears after some time
                });
                await AsyncStorage.setItem("current_order_id", orderId.toString());
                resetOrder();
            }
        } else {
            showMessage({
                message: 'Error',
                description: 'Failed to save order.',
                type: 'danger',
                duration: 3000,
            });
        }

        setIsProcessing(false); // Hide loading animation (modal)
    };




    // Reset order after payment



    return (
        <View style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

            <FlashMessage position="bottom" style={{ marginBottom: 10, marginRight: 10, marginLeft: 10, marginBottom: 10, borderRadius: 10, height: 65 }} />
            <Modal visible={isProcessing} animationType="fade" transparent>
                <View style={styles.loadmodalContainer}>
                    <View style={styles.
                        loadmodalContent}>
                        <LoadingOverlay />
                    </View>
                </View>
            </Modal>
            <BackgroundWrapper>
                <View style={styles.contentContainer}>
                    <View style={styles.productsContainer} >
                        <View style={styles.serchcontent}>
                            <Text style={styles.sectionTitle}>{i18n.t('products')}</Text>

                            <View style={styles.searchContainer}>
                                <MaterialIcons name="search" size={24} color="#999" style={styles.searchIcon} />
                                <TextInput placeholder={i18n.t('search_products')} placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} style={styles.searchInput} />
                            </View>
                        </View>


                        {isLoading ? (
                            <LoadingOverlay />
                        ) : (
                            <FlatList
                                showsVerticalScrollIndicator={false}
                                data={filteredProducts}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={styles.productList}
                                numColumns={2} // Render two items per row
                                renderItem={({ item }) => (
                                    <View style={styles.productCard}>
                                        <TouchableOpacity
                                            pointerEvents="auto"
                                            style={styles.productImageContainer}
                                            onPress={() => {
                                                setSelectedProduct(item);
                                                setProductModalVisible(true);
                                                // setModalVisible(true);
                                            }}
                                        >
                                            <Image
                                                source={{ uri: item.image }}
                                                style={styles.productImage}
                                                resizeMode="contain"
                                            />
                                            <View style={styles.toggleButton1} >
                                                <Text>Stock-{item.stock}</Text>
                                            </View>
                                        </TouchableOpacity>


                                        {/* Right Side: Name & Price (70% width) */}
                                        <TouchableOpacity
                                            style={styles.productInfoContainer}
                                            onPress={() => addToOrder(item)}
                                        >
                                            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                                            <Text style={styles.productPrice}>{i18n.t('rs')}{item.price.toFixed(2)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                            />
                        )};

                    </View>

                    <Animated.View style={[styles.orderCard, { left: slideAnim }]}>
                        {/* Header with Close Button */}
                        <View style={styles.quantityPrice}>
                            <Text style={styles.sectionTitle}>Current Order #{currentOrderId || "0"}</Text>
                            <TouchableOpacity onPress={clearOrder}>
                                <MaterialIcons name="delete" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <Picker
                            selectedValue={customerId}
                            onValueChange={(itemValue) => {
                                if (itemValue === "create_customer") {
                                    setAddCustomerModalVisible(true); // Open modal when "Create Customer" is selected
                                } else {
                                    setCustomerId(itemValue);
                                }
                            }}
                            mode="dialog"

                        >
                            <Picker.Item label="Select Customer" value="" />
                            <Picker.Item label="Create Customer" value="create_customer" />
                            {customers.map((customer) => (
                                <Picker.Item key={customer.id} label={customer.shop_name} value={customer.id} />
                            ))}
                        </Picker>
                        <View style={styles.orderListContainer} >
                            <FlatList
                                showsVerticalScrollIndicator={false}
                                data={order}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <View style={styles.orderItem}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <View style={styles.quantityPrice}>
                                            <TextInput style={styles.qtytInput} placeholder="Quantity" keyboardType="numeric" value={item.quantity.toString()} onChangeText={(text) => updateQuantity(item.id, text)}
                                            />
                                            <Text style={styles.itemPrice}>{i18n.t('rs')}{(item.price * item.quantity).toFixed(2)}</Text>
                                            <TouchableOpacity onPress={() => removeFromOrder(item.id)}>
                                                <MaterialIcons name="delete-outline" size={24} color="black" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                                ListFooterComponent={
                                    <>
                                        <View style={styles.totalContainer}>
                                            <Text style={styles.totalLabel}>{i18n.t('total')}</Text>
                                            <Text style={styles.totalAmount}>{i18n.t('rs')}{total.toFixed(2)}</Text>
                                        </View>

                                        <TextInput
                                            style={styles.amountInput}
                                            placeholder={(i18n.t('amount_received'))}
                                            placeholderTextColor="#999"
                                            keyboardType="numeric"
                                            value={amountGiven}
                                            onChangeText={setAmountGiven}
                                        />


                                        <View style={styles.changeContainer}>
                                            <Text style={styles.changeLabel}>{i18n.t('balance')}</Text>
                                            <Text style={styles.changeAmount}>{i18n.t('rs')}{change.toFixed(2)}</Text>
                                        </View>
                                        <TouchableWithoutFeedback>
                                            <TouchableOpacity
                                                pointerEvents="auto"
                                                style={[styles.paymentButton, isProcessing && { opacity: 0.5 }]}
                                                onPress={processPayment}
                                                disabled={isProcessing}
                                            >

                                                <>
                                                    <MaterialIcons name="payment" size={24} color="#fff" />
                                                    <Text style={styles.buttonText}>&nbsp;&nbsp;&nbsp;{i18n.t('process_payment')}</Text>
                                                </>

                                            </TouchableOpacity>
                                        </TouchableWithoutFeedback>

                                    </>
                                }
                            />
                        </View>
                    </Animated.View>

                    <TouchableOpacity style={styles.toggleButton} onPress={toggleOrderSection}>
                        <MaterialIcons
                            name={showOrderSection ? "chevron-left" : "chevron-right"}
                            size={24}
                            color="white"
                        />
                    </TouchableOpacity>

                </View> </BackgroundWrapper>
            <AddCustomerModal visible={addCustomerModalVisible} onClose={() => setAddCustomerModalVisible(false)} refreshCustomers={fetchCustomers} />
            {currentOrderId && (
                <PaymentModal visible={completeModalVisible} onClose={() => setCompleteModalVisible(false)} orderId={currentOrderId} setOrders={order} />
            )}


            <ProductModal visible={productModalVisible} onClose={() => setProductModalVisible(false)} selectedProduct={selectedProduct} />
        </View>


    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",

    },
    background: {
        flex: 1,
        resizeMode: "cover",
    },
    contentContainer: {
        flex: 1,
        padding: 10,
    },
    productsContainer: {
        flex: 1,
    },
    productList: {
        padding: 5, // Add padding to the list container
    },
    productCard: {
        flex: 1, // Allow the card to grow
        margin: 8, // Add margin between cards
        maxWidth: '48%', // Ensure two cards fit in a row with spacing

        borderRadius: 8, // Optional: Add rounded corners
        shadowColor: '#000', // Optional: Add shadow for better UI
        shadowOffset: { width: 0, height: 2 },

    },
    toggleButton: {
        position: "absolute",
        left: 0,
        top: "90%",
        backgroundColor: "rgb(228, 9, 100)",
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
    },
    toggleButton1: {
        position: "absolute",
        right: 0,
        top: "80%",
        backgroundColor: 'hsl(340, 93.20%, 71.20%)',
        paddingVertical: 5,
        marginTop: 0,
        paddingHorizontal: 25,
        borderTopLeftRadius: 20,

    },
    productImageContainer: {
        width: '100%',
        height: 110, // Set a fixed height for the image container
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black', // Placeholder background color
        borderRadius: 8, // Optional: Match the card's border radius
        marginBottom: 3,
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    productInfoContainer: {
        padding: 10,
        backgroundColor: 'rgb(243, 178, 214)',
        borderRadius: 8,

    },
    productName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    productPrice: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    // Other styles remain unchanged
    sectionTitle: {
        fontSize: isTablet ? width * 0.025 : 18,
        fontWeight: "bold",
        marginBottom: height * 0.01,
        color: "#333",
    },
    serchcontent: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 50,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        marginLeft: 20,
        width: "60%",
    },
    searchIcon: {
        marginLeft: 12,
    },
    searchInput: {
        flex: 1,

        fontSize: 14,
        color: '#2d2d2d',
        height: 40,
    },

    qtytInput: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 50,
        width: '30%',
        textAlign: 'center',
    },
    Picker: {
        backgroundColor: 'red',
        borderRadius: 50,
    },

    orderCard: {
        position: "absolute",
        left: "0%",
        width: isTablet ? "50%" : "75%",
        backgroundColor: "rgb(255, 227, 238)",
        height: "100%",
        padding: 10,
        borderRadius: 10,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 5,
        marginTop: 10,

    },
    orderItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: height * 0.01,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    itemName: {
        fontSize: isTablet ? width * 0.018 : 14,
        flex: 2,
        color: "#666",
    },
    quantityPrice: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    itemQty: {
        fontSize: isTablet ? width * 0.018 : 14,
        color: "#888",
    },
    itemPrice: {
        fontSize: isTablet ? width * 0.018 : 14,
        color: "#444",
        fontWeight: "500",
    },
    totalContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: height * 0.02,
        paddingVertical: height * 0.01,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    totalLabel: {
        fontSize: isTablet ? width * 0.022 : 16,
        fontWeight: "bold",
        color: "#333",
    },
    totalAmount: {
        fontSize: isTablet ? width * 0.022 : 16,
        fontWeight: "bold",
        color: "rgb(253, 99, 163)",
    },
    amountInput: {
        height: isTablet ? height * 0.1 : 45,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 50,
        paddingHorizontal: width * 0.03,
        marginVertical: height * 0.02,
        fontSize: isTablet ? width * 0.02 : 16,
    },
    changeContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: height * 0.02,
    },
    changeLabel: {
        fontSize: isTablet ? width * 0.02 : 16,
        color: "black",
        fontWeight: 'bold',
    },
    changeAmount: {
        fontSize: isTablet ? width * 0.02 : 16,
        fontWeight: "500",
        color: "rgb(253, 99, 112)",
    },
    paymentButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "black",
        padding: height * 0.015,
        borderRadius: 50,
        marginTop: height * 0.01,
    },
    buttonText: {
        color: "#fff",
        fontSize: isTablet ? width * 0.02 : 16,
        fontWeight: "bold",
    },
    cobuttonText: {
        color: "black",
        fontSize: isTablet ? width * 0.02 : 16,
        fontWeight: "bold",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "rgb(255, 227, 238)",
        padding: width * 0.025,
        borderRadius: 10,
        width: width * 0.7,
        maxWidth: '90%',
    },
    loadmodalContainer: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.63)",
        justifyContent: "center",
        alignItems: "center",
    },
    loadmodalContent: {
        padding: width * 0.025,
        borderRadius: 10,
        width: width * 0.8,
        maxWidth: '90%',
    },
    modalImage: {
        width: "100%",
        height: width * 0.5,
        marginBottom: height * 0.02,
    },
    modalProductTitle: {
        fontSize: isTablet ? width * 0.02 : 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: height * 0.02,
    },
    closeButton: {

        borderRadius: 50,
        marginTop: height * 0.01,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default DashboardScreen;