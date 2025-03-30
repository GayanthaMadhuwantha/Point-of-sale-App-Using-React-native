
import React, { useContext } from "react";
import { View, Text,  TouchableOpacity, StyleSheet, Image, TouchableWithoutFeedback, Modal,Dimensions } from "react-native";
import { LanguageContext } from '../LanguageContext';
import i18n from '../i18n'
import LoadingOverlay from "../components/LoadingOverlay";
const { width, height } = Dimensions.get("window");
const isTablet = width >= 768; // 


const ProductModal = ({ visible, onClose, selectedProduct }) => {

  const { language, updateLanguage } = useContext(LanguageContext);

  
  return (
     <Modal visible={visible}
                       animationType="fade" transparent
                       onRequestClose={onClose}
                   >
                       <TouchableWithoutFeedback onPress={onClose}>
                           <View style={styles.modalContainer}>
                               <TouchableWithoutFeedback>
                                   <View style={styles.modalContent}>
                                       {selectedProduct && (
                                           <>
                                               <Image
                                                   source={{ uri: selectedProduct.image }}
                                                   style={styles.modalImage}
                                                   resizeMode="contain"
                                               />
                                               <Text style={styles.modalProductTitle}>{selectedProduct.name}</Text>
                                               <TouchableWithoutFeedback>
                                                   <TouchableOpacity pointerEvents="auto" onPress={onClose} style={styles.closeButton}>
                                                       <Text style={styles.cobuttonText}>Close</Text>
                                                   </TouchableOpacity></TouchableWithoutFeedback>
                                           </>
                                       )}
                                   </View>
                               </TouchableWithoutFeedback>
                           </View>
                       </TouchableWithoutFeedback>
                   </Modal>

  )
}
const styles = StyleSheet.create({
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

export default ProductModal ;