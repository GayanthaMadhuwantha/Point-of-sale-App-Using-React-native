import React, { useEffect, useState, useContext } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, RefreshControl, KeyboardAvoidingView, Platform, ScrollView, Image, TouchableWithoutFeedback, Alert } from "react-native";
import {fetchProducts, deleteProduct } from "../services/database";
import Icon from 'react-native-vector-icons/MaterialIcons';

import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { LanguageContext } from '../LanguageContext';
import i18n from '../i18n'
import LoadingOverlay from "../components/LoadingOverlay";
import AddUpdateProduct from "./AddUpdateProduct";
import ProductModal from "./ProductModal";
import BackgroundWrapper from "../components/BackgroundWrapper";

const InventoryScreen = ({ navigation }) => {
  const [search, setSearch] = useState("");  // State for search input
  const [minPrice, setMinPrice] = useState("");  // State for minimum price filter
  const [maxPrice, setMaxPrice] = useState("");  // State for maximum price filter
  const [minStock, setMinStock] = useState("");  // State for minimum stock filter
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);  // State for filtered products
  const [editingProduct, setEditingProduct] = useState(null);
  const { language, updateLanguage } = useContext(LanguageContext);
  const [isLoading, setIsLoading] = useState(false);
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);



  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();  // Apply filter whenever search, price, or stock changes
  }, [search, minPrice, maxPrice, products]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
    finally {
      setIsLoading(false);
    }


  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
    setTimeout(() => {
      setRefreshing(false);
    }, 2000); // Simulating API fetch
  };

  const filterProducts = () => {
    let filtered = products;

    if (search) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (minPrice) {
      filtered = filtered.filter((product) => product.price >= parseFloat(minPrice));
    }

    if (maxPrice) {
      filtered = filtered.filter((product) => product.price <= parseFloat(maxPrice));
    }

    if (minStock) {
      filtered = filtered.filter((product) => product.stock >= parseInt(minStock));
    }

    setFilteredProducts(filtered);
  };


  const handleEdit = (product) => {
    setEditingProduct(product);

    setAddProductModalVisible(true);
  };

  const handleDelete = async (id) => {
    await deleteProduct(id);
    loadProducts();
  };

  

  const navigateGRn = async () => {
    Alert.alert("sucess","hi");
    
  }


  return (

    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <FlashMessage position="bottom" style={{ marginBottom: 10, marginRight: 10, marginLeft: 10, marginBottom: 10, borderRadius: 10, height: 60 }} />
      <BackgroundWrapper>
        <ScrollView contentContainerStyle={styles.scrollContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Search & Filter</Text>
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                placeholder={i18n.t('search_products')}
                placeholderTextColor="#666"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>

            <View style={styles.filterRow}>
              <TextInput
                placeholder={i18n.t("min_price")}
                placeholderTextColor="#666"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
                style={[styles.input, styles.filterInput]}
              />
              <TextInput
                placeholder={i18n.t("max_price")}
                placeholderTextColor="#666"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                style={[styles.input, styles.filterInput]}
              />
              {<TextInput
                placeholder={i18n.t("min_stock")}
                placeholderTextColor="#666"
                value={minStock}
                onChangeText={setMinStock}
                keyboardType="numeric"
                style={[styles.input, styles.filterInput]}
              />}
            </View>
          </View>

          {/* Inventory List Section */}

          {isLoading ? (
            <LoadingOverlay />
          ) : (


            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={styles.sectionTitle}>{i18n.t('inventory_list')}({filteredProducts.length})</Text>
                <TouchableOpacity onPress={() => { navigateGRn() }}><Text style={{ color: 'rgb(250, 29, 102)', fontWeight: 'bold' }}>Add Stock for Products</Text></TouchableOpacity></View>

              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <><View style={styles.productCard}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedProduct(item);
                        setProductModalVisible(true);
                        // setModalVisible(true);
                      }}>
                      {item.image && <Image source={{ uri: item.image }} style={styles.productImage1} />}</TouchableOpacity>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <View style={styles.productDetails}>
                        <Text style={styles.productPrice}>{i18n.t('rs')}{item.price.toFixed(2)}</Text>
                        {<Text style={styles.productStock}>{i18n.t('stock')} {item.stock}</Text>}
                      </View>
                    </View>
                    <View style={styles.actionsContainer}>
                      <TouchableWithoutFeedback>
                        <TouchableOpacity pointerEvents="auto"
                          onPress={() => handleEdit(item)}

                        >
                          <Icon name="edit" size={25} color="black" />
                        </TouchableOpacity></TouchableWithoutFeedback>
                      <TouchableWithoutFeedback>
                        <TouchableOpacity pointerEvents="auto"
                          onPress={() => handleDelete(item.id)}

                        >
                          <Icon name="delete" size={25} color="black" />
                        </TouchableOpacity></TouchableWithoutFeedback>

                    </View>

                  </View><View style={styles.horizontalLine}></View></>

                )}

              />

              {editingProduct ? (
                <AddUpdateProduct visible={addProductModalVisible} onClose={() => setAddProductModalVisible(false)} product={editingProduct} loadProducts={loadProducts} />
              ) : (
                <AddUpdateProduct visible={addProductModalVisible} onClose={() => setAddProductModalVisible(false)} product={null} loadProducts={loadProducts} />
              )}


            </View>
          )}
        </ScrollView></BackgroundWrapper>
      <TouchableOpacity style={styles.floatingButton} onPress={() => setAddProductModalVisible(true)}>
        <FontAwesome6 name="plus" size={28} color="white" />

      </TouchableOpacity>
      <ProductModal visible={productModalVisible} onClose={() => setProductModalVisible(false)} selectedProduct={selectedProduct} />
    </KeyboardAvoidingView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,

  },
  input: {
    fontSize: 16,
  },
  imagePickerButton: { backgroundColor: "black", padding: 12, borderRadius: 50, flexDirection: 'row', justifyContent: 'center' },
  productImage: { width: 50, height: 50, borderRadius: 6, marginLeft: 20, alignSelf: "center" },
  productImage1: { width: 50, height: 50, borderRadius: 6, marginLeft: 5, alignSelf: "center" },

  productThumbnail: { width: 50, height: 50, borderRadius: 6, marginRight: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: "rgb(255, 227, 239)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2d2d',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 50,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    color: '#2d2d2d',
    borderWidth: 1,
    borderColor: "#ccc",
  },
  horizontalLine: {
    width: '100%', // Full width
    height: 1, // Thickness of the line
    backgroundColor: 'rgb(0, 0, 0)', // Color of the line
    marginVertical: 2, // Space above and below the line
  },
  button: {
    flexDirection: 'row',
    backgroundColor: 'black',
    borderRadius: 50,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#787878',
  },
  Text: {
    fontSize: 11,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText1: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    color: '#2d2d2d',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterInput: {
    flex: 1,
    height: 42,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "black",
    padding: 15,
    paddingLeft: 18,
    paddingRight: 18,
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",

  },
  floatingButtonText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "bold",
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderRadius: 8,
    padding: 10,

  },
  productInfo: {
    flex: 1,
    marginLeft: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d2d2d',
    marginBottom: 4,
  },
  productDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  productPrice: {
    fontSize: 14,
    color: 'rgb(255, 55, 121)',
    fontWeight: '500',
  },
  productStock: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 20
  },
  editButton: {
    backgroundColor: '#ffc107',
    borderRadius: 6,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 6,
    padding: 8,
  },
  picimage: {

    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default InventoryScreen;
