import React from "react";
import LottieView from 'lottie-react-native';
import { View,StyleSheet } from "react-native";

const LoadingOverlay = () => (
    <View style={styles.loadingContainer}>
    <LottieView 
      source={require('../../assets/Loading.json')} 
      autoPlay
      loop
      style={{ width: 150, height: 150 }}
    />
  </View>
  
  );
  const styles = StyleSheet.create({
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      
    },
  });
  
  export default LoadingOverlay;