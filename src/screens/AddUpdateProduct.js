
import React, { useEffect, useState, useContext } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, TouchableWithoutFeedback, Modal, Alert } from "react-native";
import { addProduct, updateProduct } from "../services/database";
import * as ImagePicker from 'expo-image-picker';
import { LanguageContext } from '../LanguageContext';
import i18n from '../i18n'


const AddUpdateProduct = ({ visible, onClose, product, loadProducts }) => {
  const [products,setProducts]=useState(product);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [intialPrice, setIntialPrice] = useState("")
  const [imageUri, setImageUri] = useState("");
  const { language, updateLanguage } = useContext(LanguageContext);

  useEffect(() => {
    if (product) {
      setProducts(product);
      setName(product.name || "");
      setPrice(product.price.toString() || "");
      setIntialPrice(product.initial_price.toString() || "")
      setImageUri(product.imageUri || "");

    }
    else {
      setName("");
      setPrice("");
      setIntialPrice("")
      setImageUri("");
    }
  }, [product])


  const handleAddProduct = async () => {
    if (!name || !price || !imageUri) {
      Alert.alert(i18n.t("error"), i18n.t("all_fields_including_an_image_are_required"));
      return;
    }
    if (!intialPrice) {
      setIntialPrice(price)
    }

    try {
      if (product) {
        await updateProduct(editingProduct.id, name, parseFloat(price), parseFloat(intialPrice), 0, imageUri);
        Alert.alert(i18n.t("success"), i18n.t("product_updated_successfully"));
      }
      else {
        await addProduct(name, parseFloat(price), parseFloat(intialPrice), 0, imageUri);
        Alert.alert(i18n.t("success"), i18n.t("product_added_successfully"));
      }
      loadProducts();
      onClose();
    }
    catch (error) {
      Alert.alert(i18n.t("error"), "Something went wrong");
    }
  }


  const cleardata = async () => {
    setProducts(null);
    onClose();
    clearAll();
  }

  const clearAll = async () => {
    setName("");

   setPrice("");
   setIntialPrice("");
   setImageUri(null);

  }
  const handlePickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Open Image Picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };


  /* if (editingProduct) {
    
     setEditingProduct(null);

   } else {
     await addProduct(name, parseFloat(price), 0, imageUri);
   }
  
   setName("");
   setPrice("");
   setImageUri(null);
   loadProducts();
 };*/

  /*const handleEdit = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    
  };*/



  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      {/* Title */}
      <Text style={styles.modalTitle}>
        {product ? i18n.t("edit_product") : i18n.t("add_new_product")}
      </Text>

      {/* Product Name Input */}
      <TextInput
        placeholder={i18n.t("product_name")}
        placeholderTextColor="#666"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      {/* Price Input */}
      <TextInput
        placeholder={i18n.t("price")}
        placeholderTextColor="#666"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
      />

      {/* Initial Price Input */}
      <TextInput
        placeholder={i18n.t("initial_price")}
        placeholderTextColor="#666"
        value={intialPrice}
        onChangeText={setIntialPrice}
        keyboardType="numeric"
        style={styles.input}
      />

      {/* Image Picker */}
      <View style={styles.imageContainer}>
        <TouchableOpacity onPress={handlePickImage} style={styles.imageButton}>
          <Text style={styles.imageButtonText}>{i18n.t("select_an_image")}</Text>
        </TouchableOpacity>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.productImage} />}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.cancelButton} onPress={cleardata}>
          <Text style={styles.cancelButtonText}>{i18n.t("cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.updateButton, (!name || !price) && styles.disabledButton]}
          onPress={handleAddProduct}
          disabled={!name || !price}
        >
          
          <Text style={styles.buttonText}>
            {product ? i18n.t("update_product") : i18n.t("add_product")}
          </Text>
        </TouchableOpacity>

      
      </View>
    </View>
  </View>
  </TouchableWithoutFeedback>
</Modal>

  )
}
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    backgroundColor: "rgb(255, 227, 238)",
    
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    borderBottomWidth: 1,
    padding: 10,
    marginBottom: 12,
    borderBottomColor: "gray",
  },
  imageContainer: {
    flexDirection: "row",
    marginVertical: 15,
    
  },
  imageButton: {
    flexDirection: "row",
   padding:10,
   marginLeft:-15,
    borderRadius: 8,
  },
  imageButtonText: {
    color: "black",
    marginLeft: 10,
    fontSize: 14,
    fontWeight: 'bold',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginLeft: 15,
  },
  buttonContainer:{
   
    borderRadius: 50,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 30
  },
  updateButton: {
    flexDirection: "row",
    maxWidth: "50%",
  },
  buttonText: {
    color: "black",
    fontSize: 15,
    fontWeight: 'bold',
    
  },
  cancelButton: {
    flexDirection: "row",
    maxWidth: "50%",
    
  },
  cancelButtonText: {
    color: "indianred",
    fontSize: 15,
    fontWeight: 'bold',
  },
  disabledButton: {
  },
});

export default AddUpdateProduct;