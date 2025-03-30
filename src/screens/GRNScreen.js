import React, { useState, useEffect, useContext } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Modal,
    Alert,
    ScrollView, RefreshControl
} from "react-native"
import { Ionicons, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { Picker } from "@react-native-picker/picker";
import FlashMessage, { showMessage } from 'react-native-flash-message';
import {
    saveGRN,      // Saves GRN and updates product stock
    deleteGRN,    // Deletes a GRN (and rolls back stock)
    getGRNDetails,// Returns { grn, items } for a given GRN ID
    getAllGRNs,   // Returns list of all GRNs
    fetchProducts,  // Returns list of available products
} from "../services/database";
import { LanguageContext } from '../LanguageContext';
import i18n from '../i18n'
import LoadingOverlay from "../components/LoadingOverlay";
import AddUpdateProduct from "./AddUpdateProduct";
import BackgroundWrapper from "../components/BackgroundWrapper";


const GRNScreen = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState("");
    const [grnItems, setGrnItems] = useState([]);
    const [grnList, setGrnList] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedGRN, setSelectedGRN] = useState(null);
    const [dropDownOpen, setDropDownOpen] = useState(false);
    const { language, updateLanguage } = useContext(LanguageContext);
    const [status, setStatus] = useState("loading");
    const [addUpdateProductModalVisible, setAddUpdateProductModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        const productData = await fetchProducts();
        setProducts(productData);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
        loadItems();
        setTimeout(() => {
            setRefreshing(false);
        }, 2000); // Simulating API fetch
    };
    const loadItems = async () => {
        setStatus("loading");
        const grnData = await getAllGRNs();
        setGrnList(grnData);
        setStatus("success");
    };
    // Load Products and GRN History on mount
    useEffect(() => {

        loadData();
        loadItems();
    }, []);

    /*if (status === "loading") {
        return <LoadingOverlay />;
      }
      */
    // Show error message if loading failed
    if (status === "error") {
        return <Text style={{ textAlign: "center", marginTop: 20 }}>Failed to load products</Text>;
    }


    // Add product to GRN Items: if product exists, increment quantity
    const addProductToGRN = () => {
        if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
            Alert.alert("Error", "Please select a product and enter a valid quantity.");
            return;
        }

        const productData = products.find((prod) => prod.id === selectedProduct);
        if (!productData) {
            Alert.alert("Error", "Invalid product selected.");
            return;
        }

        const qty = parseInt(quantity);
        const existingIndex = grnItems.findIndex((item) => item.id === productData.id);
        if (existingIndex > -1) {
            // Increment quantity if product already exists
            const updatedItems = [...grnItems];
            updatedItems[existingIndex].quantity += qty;
            setGrnItems(updatedItems);
        } else {
            // Add new product to GRN items
            const newItem = {
                id: productData.id,
                productId: productData.id, // for saving purposes
                name: productData.name,
                price: productData.price,
                quantity: qty,
                total: productData.price * qty,
            };
            setGrnItems([...grnItems, newItem]);
        }
        // Clear the selection fields
        setSelectedProduct(null);
        setQuantity("");
    };

    // Remove an individual GRN item
    const removeGrnItem = (productId) => {
        const updatedItems = grnItems.filter((item) => item.id !== productId);
        setGrnItems(updatedItems);
    };

    // Clear all current GRN items
    const clearItems = () => {
        setGrnItems([]);
    };

    // Generate PDF report for GRN details using expo-print
    const generateGRNPdf = async (grnId) => {
        try {
            const data = await getGRNDetails(grnId);
            let html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1, h2 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            </style>
          </head>
          <body>
            <h1>GRN Report</h1>
            <h2>GRN #${data.grn.id}</h2>
            <p><strong>Date:</strong> ${data.grn.date}</p>
            <p><strong>Total:</strong> ${i18n.t("rs")}.${data.grn.total}</p>
            <h2>Items Received</h2>
            <table>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>`;
            data.items.forEach((item) => {
                html += `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price}</td>
              </tr>`;
            });
            html += `
            </table>
          </body>
        </html>
      `;
            const { uri } = await Print.printToFileAsync({ html });
            Alert.alert("PDF Generated", `PDF saved at ${uri}`);
        } catch (error) {
            Alert.alert("Error", "Failed to generate PDF report.");
        }
    };

    // Save GRN: insert GRN and GRN items, update product stock, then clear current items and generate PDF
    const handleSaveGRN = async () => {
        if (grnItems.length === 0) {
            Alert.alert("Error", "No items to save.");
            return;
        }
        const grnId = await saveGRN(grnItems);
        if (grnId) {
            showMessage({
                message: 'Success',
                description: `GRN #${grnId} saved successfully!`,
                type: 'success', // 'success', 'danger', 'warning', 'info'
                duration: 3000,
            });
            setGrnItems([]); // Clear current items
            generateGRNPdf(grnId);
            const grnData = await getAllGRNs();
            setGrnList(grnData);
        } else {
            Alert.alert("Error", "Failed to save GRN.");
        }
    };

    // Delete GRN and refresh history
    const handleDeleteGRN = async (grnId) => {
        Alert.alert("Confirm", "Are you sure you want to delete this GRN?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Yes",
                onPress: async () => {
                    await deleteGRN(grnId);
                    Alert.alert("Deleted", "GRN removed successfully!");
                    const grnData = await getAllGRNs();
                    setGrnList(grnData);
                },
            },
        ]);
    };

    // Load GRN details into modal for viewing
    const handleViewGRN = async (grnId) => {
        const data = await getGRNDetails(grnId);
        setSelectedGRN(data);
        setModalVisible(true);
    };

    // Calculate total amount for current GRN items
    const totalAmount = grnItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    return (
        <BackgroundWrapper><View style={styles.container}>
            <FlashMessage position="bottom" style={{ marginBottom: 10, marginRight: 10, marginLeft: 10, marginBottom: 10, borderRadius: 10, height: 65 }} />
            
            <ScrollView contentContainerStyle={styles.scrollContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {/* Product Selection Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{i18n.t('add_products')}</Text>
                    <Picker
                        value={selectedProduct}
                        onValueChange={(itemValue) => {
                            if (itemValue === "create_product") {
                                setAddUpdateProductModalVisible(true);
                            }
                            else {
                                setSelectedProduct(itemValue);
                            }
                        }}
                        mode="dialog"
                        style={styles.picker}
                    >
                        <Picker.Item label={i18n.t("select_product")} value="" />
                        <Picker.Item label="Create Product" value="create_product" />
                        {products.map((product) => (
                            <Picker.Item
                                key={product.id}
                                label={product.name}
                                value={product.id}
                            />
                        ))}

                    </Picker>
                    <TextInput
                        placeholder={i18n.t("quantity")}
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={quantity}
                        onChangeText={setQuantity}
                        style={styles.input}
                    />
                    <TouchableOpacity
                        onPress={addProductToGRN}
                        style={styles.primaryButton}
                    >
                        <FontAwesome6 name="add" size={20} color="#ffff" />
                        <Text style={styles.buttonText}>{i18n.t('add_to_grn')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Current GRN Items */}
                {grnItems.length > 0 && (
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{i18n.t('current_items')}</Text>
                            <TouchableOpacity
                                onPress={clearItems}
                                style={styles.iconButton}
                            >
                                <MaterialIcons name="delete" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={grnItems}
                            scrollEnabled={false}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.listItem}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text>{i18n.t('qty')}: {item.quantity}</Text>
                                    <TouchableOpacity onPress={() => removeGrnItem(item.id)}>
                                        <MaterialIcons name="delete-outline" size={24} color="black" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                        <Text style={styles.totalText}>{i18n.t('total')}: {i18n.t('rs')}{totalAmount.toFixed(2)}</Text>
                    </View>
                )}

                {/* GRN History */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{i18n.t('grn_history')}</Text>
                    <FlatList
                        data={grnList}
                        scrollEnabled={false}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.grnItem}>
                                <View style={styles.grnInfo}>
                                    <Text style={styles.grnId}>{i18n.t('grn')} #{item.id}</Text>
                                    <Text style={styles.grnDate}>{item.date}</Text>
                                </View>
                                <View style={styles.grnActions}>
                                    <TouchableOpacity
                                        onPress={() => handleViewGRN(item.id)}
                                        style={styles.actionButton}
                                    >
                                        <MaterialIcons name="view-agenda" size={22} color="black" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteGRN(item.id)}
                                        style={styles.actionButton}
                                    >
                                        <MaterialIcons name="delete-outline" size={24} color="black" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                </View>
            </ScrollView>
          

            {/* Floating Save Button */}
            {grnItems.length > 0 && (
                <TouchableOpacity
                    onPress={handleSaveGRN}
                    style={styles.floatingButton}
                >
                    <MaterialIcons name="save-alt" size={24} color="white" />
                    <Text style={styles.floatingButtonText}>{i18n.t('save_grn')}</Text>
                </TouchableOpacity>
            )}

            <AddUpdateProduct visible={addUpdateProductModalVisible} onClose={()=>setAddUpdateProductModalVisible(false)} product={null} loadProducts={null}/>

            {/* GRN Details Modal */}
            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{i18n.t('grn_details')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        {selectedGRN && (
                            <>
                                <View style={styles.modalSection}>
                                    <Text style={styles.detailLabel}>{i18n.t('grn_id')}:#{selectedGRN.grn.id}</Text>
                                    <Text style={styles.detailValue}></Text>
                                    <Text style={styles.detailLabel}>{i18n.t('date')}:{selectedGRN.grn.date}</Text>
                                    <Text style={styles.detailValue}></Text>
                                    <Text style={styles.detailLabel}>{i18n.t('total', 'rs')}.{selectedGRN.grn.total}</Text>
                                    <Text style={styles.detailValue}></Text>
                                </View>
                                <Text style={styles.subTitle}>{i18n.t('items_received')}</Text>

                                <View style={styles.receiptContainer}>
                                    <View style={styles.receiptHeader}>
                                        <Text style={styles.headerText}>{i18n.t('item')}</Text>
                                        <Text style={styles.headerText}>{i18n.t('quantity')}</Text>
                                        <Text style={styles.headerText}>{i18n.t('price')}({i18n.t('rs')})</Text>
                                        <Text style={styles.headerText}>{i18n.t('total')}({i18n.t('rs')})</Text>
                                    </View>





                                    <FlatList
                                        data={selectedGRN.items}
                                        scrollEnabled={false}
                                        keyExtractor={(item) => item.id.toString()}
                                        renderItem={({ item }) => (
                                            <View key={item.id} style={styles.receiptRow}>
                                                <Text style={styles.itemText}>{item.product_name}</Text>
                                                <Text style={styles.itemText}>{item.quantity}</Text>
                                                <Text style={styles.itemText}>{item.price.toFixed(2)}</Text>
                                                <Text style={styles.itemText}>{item.total}</Text>
                                            </View>
                                        )}
                                    />
                                </View>
                            </>
                        )}
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={styles.button}
                        >
                            <Text style={{color: "black", textAlign: 'center',marginTop:20,fontWeight:'bold'}}>{i18n.t('close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
        </View></BackgroundWrapper>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    scrollContainer: { paddingBottom: 20 },
    card: {
        backgroundColor:"rgb(255, 227, 238)",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
    dropdown: { marginBottom: 10, borderRadius: 30 },
    dropdownText: { fontSize: 14 },
    placeholderText: { color: "#999" },
    dropdownContainer: { backgroundColor: "#fff", borderRadius: 20 },
    input: {
        borderWidth: 1,
        borderColor: "black",
        padding: 10,
        marginBottom: 10,
        borderRadius: 50,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
        gap: 5,
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
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'center',
        backgroundColor: "black",
        padding: 12,
        borderRadius: 50,
        marginBottom: 10,
        maxWidth:400,
    },
    buttonText: { color: "#fff", marginLeft: 5, textAlign: 'center', },
    iconButton: { padding: 5 },
    buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 10,
        borderBottomWidth: 1,
    },
    totalText: { fontWeight: "bold", textAlign: "right", marginTop: 10 },
    grnItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 10,
        borderBottomWidth: 1,
    },
    grnInfo: {},
    grnId: { fontWeight: "bold" },
    grnDate: { color: "#666" },
    grnActions: { flexDirection: "row", gap: 10 },
    actionButton: { marginLeft: 10 },
    floatingButton: {
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "black",
        padding: 15,
        borderRadius: 50,
        flexDirection: "row",
        alignItems: "center",

    },
    floatingButtonText: {
        color: "#fff",
        marginLeft: 5,
        fontWeight: "bold",
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "rgb(255, 227, 238)",
        padding: 15,
        borderRadius: 10,
        width: "90%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    modalTitle: { fontSize: 18, fontWeight: "bold" },
    modalSection: { marginBottom: 15 },
    detailLabel: { fontWeight: "bold" },
    detailValue: { marginBottom: 5 },
    subTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
    detailItem: { marginBottom: 10 },
    itemName: { fontWeight: "bold" },
    itemDetails: { flexDirection: "row", justifyContent: "space-between" },
    itemDetail: { marginRight: 10 },
});

export default GRNScreen;
