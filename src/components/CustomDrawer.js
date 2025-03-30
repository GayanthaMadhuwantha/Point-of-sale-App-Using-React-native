import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";

const CustomDrawer = (props) => {
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    const loadLogo = async () => {
      const storedLogo = await AsyncStorage.getItem("restaurant_logo");
      if (storedLogo) {
        setLogo(storedLogo);
      }
    };
    loadLogo();
  }, []);

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <TouchableOpacity>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.logo} />
          ) : (
            <Text style={styles.uploadText}>Upload Logo</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.restaurantName}>My Restaurant</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    
    paddingTop: 10,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#fff",
  },
  uploadText: {
    color: "#fff",
    fontSize: 14,
  },
  restaurantName: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
});

export default CustomDrawer;
