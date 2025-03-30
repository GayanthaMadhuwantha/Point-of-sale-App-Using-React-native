// screens/AuthScreen.js
import React from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, Modal,Dimensions } from 'react-native';
import { authenticate } from '../services/Authentication';
import LoadingOverlay from '../components/LoadingOverlay';

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768; // 
export default function AuthScreen({visible, onClose, setIsAuthenticated }) {

  const handleRetry = async () => {
    const success = await authenticate();
    if (success) {
      setIsAuthenticated(true)
      onClose();

    } else {
      Alert.alert("Authentication Failed", "Please try again.");
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
       <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
          <LoadingOverlay />
          <Text style={{ color: 'balck', textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>Authentication</Text>
          <TouchableOpacity style={{  padding: 10, borderRadius: 50, width: 150 }} onPress={handleRetry} >
            <Text style={{ color: 'black', textAlign: 'center', fontSize: 18 ,color:'rgb(255, 73, 103)'}}>Retry</Text>
          </TouchableOpacity>
          
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "80%", backgroundColor: "rgb(255, 227, 238)", padding: 20, borderRadius: 10 ,justifyContent: 'center', alignItems: 'center',},
});