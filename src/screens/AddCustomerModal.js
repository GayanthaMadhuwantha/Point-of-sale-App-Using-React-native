import React, { useState, useEffect,useContext } from "react";
import { 
  View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, Alert,
  TouchableWithoutFeedback
} from "react-native";
import { updateCustomer, addcustomer } from "../services/database"; 

const AddCustomerModal = ({ visible, customer, onClose, refreshCustomers }) => {
  useEffect(() => {
    if (!visible) {
      customer = null;
      setShopName("");
      setAddress("");
      setTelephone("");
      setRegistrationNo("");
    }
  }, [visible]);
  // State variables
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [telephone, setTelephone] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");

  // Load customer data when editing
  useEffect(() => {
    if (customer!=null) {
      setShopName(customer.shop_name || "");
      setAddress(customer.address || "");
      setTelephone(customer.telephone || "");
      setRegistrationNo(customer.registration_no || "");
    }
  }, [customer]);

  // Handle save (both Add & Update)
  const handleSave = async () => {
    if (!shopName || !address || !telephone) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    try {
      if (customer) {
        // Update existing customer
        await updateCustomer(customer.id, shopName, address, telephone, registrationNo);
        Alert.alert("Success", "Customer updated successfully!");
      } else {
        // Add new customer
        await addcustomer(shopName, address, telephone, registrationNo);
        Alert.alert("Success", "Customer added successfully!");
      }
      clearAll ();
      refreshCustomers(); // Refresh customer list
      onClose(); // Close modal
    } catch (error) {
      console.error("Error saving customer:", error);
      Alert.alert("Error", "Failed to save customer.");
    }
  };

  const clearAll = async () => {
    customer=null;
  
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{customer !=null ? "Edit Customer" : "Add Customer"}</Text>

          <TextInput
            style={styles.input}
            placeholder="Shop Name"
            placeholderTextColor="#666"
            value={shopName}
            onChangeText={setShopName}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            placeholderTextColor="#666"
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            style={styles.input}
            placeholder="Telephone"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
            value={telephone}
            onChangeText={setTelephone}
          />
          <TextInput
            style={styles.input}
            placeholder="Registration No"
            placeholderTextColor="#666"
            value={registrationNo}
            onChangeText={setRegistrationNo}
          />

          <View style={styles.buttonContainer}>
           
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} >
              <Text style={styles.cabuttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.updateButton} onPress={handleSave}>
              <Text style={styles.upbuttonText}>{customer ? "Update" : "Add"}</Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};




const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "80%", backgroundColor: "rgb(255, 227, 238)", padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 10 },
  input: { borderBottomWidth: 1, padding: 10,
    marginBottom: 12,borderBottomColor: "gray" },
  buttonContainer: { flexDirection: "row", justifyContent: "flex-end",gap: 30, },
  updateButton: {  padding: 10, borderRadius: 50 ,},
  cancelButton: {  padding: 10, borderRadius: 50 },
  upbuttonText: { color: "black", textAlign: "center", fontSize: 15,fontWeight: 'bold', },
  cabuttonText: { color: "indianred", textAlign: "center", fontSize: 15, fontWeight: 'bold', }
});

export default AddCustomerModal;
