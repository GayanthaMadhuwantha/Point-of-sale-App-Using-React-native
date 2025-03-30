import React, { useState, useEffect,useContext } from "react";
import { View, Image, TouchableOpacity, Text, StyleSheet, Alert, RefreshControl, TextInput, ScrollView, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Updates from "expo-updates";
import { Picker } from "@react-native-picker/picker";
import FlashMessage, { showMessage } from 'react-native-flash-message';

import { LanguageContext } from '../LanguageContext';
import i18n from '../i18n';
import { getLockPreference, setLockPreference } from '../services/Authentication';
import BackgroundWrapper from "../components/BackgroundWrapper";
const SettingScreen = () => {
    const [logo, setLogo] = useState(null);
    const [companyName, setCompanyName] = useState("");
    const [address, setAddress] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [currency, setCurrency] = useState("LKR");
    const { language, updateLanguage} = useContext(LanguageContext);

    const [selectedLanguage, setSelectedLanguage] = useState(language);
    const [lockEnabled, setLockEnabled] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      const enabled = await getLockPreference();
      setLockEnabled(enabled);
    };
    loadPreference();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPreference();
    setTimeout(() => {
        setRefreshing(false);
    }, 2000); // Simulating API fetch
};
  const handleToggle = async (value) => {
    setLockEnabled(value);
    await setLockPreference(value);
  };

    useEffect(() => {
      setSelectedLanguage(language);
    }, [language]);
  

    useEffect(() => {
        // Load saved settings on component mount
        const loadSettings = async () => {
            try {
                const storedLogo = await AsyncStorage.getItem("restaurant_logo");
                const storedCompanyName = await AsyncStorage.getItem("company_name");
                const storedAddress = await AsyncStorage.getItem("company_address");
                const storedPhone = await AsyncStorage.getItem("company_phone");
                const storedCurrency = await AsyncStorage.getItem("currency");
                const storedLanguage = await AsyncStorage.getItem("language");

                if (storedLogo) setLogo(storedLogo);
                if (storedCompanyName) setCompanyName(storedCompanyName);
                if (storedAddress) setAddress(storedAddress);
                if (storedPhone) setPhoneNumber(storedPhone);
                if (storedCurrency) setCurrency(storedCurrency);
                if (storedLanguage) setSelectedLanguage(storedLanguage);
            } catch (error) {
                console.error("Error loading settings:", error);
            }
        };

        loadSettings();
    }, []);

    const selectLogo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission required", "Please allow access to your media library.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!result.canceled) {
            const imageUri = result.assets[0].uri;
            setLogo(imageUri);
            await AsyncStorage.setItem("restaurant_logo", imageUri);
        }
    };

    const saveSettings = async () => {
        try {
            await AsyncStorage.setItem("company_name", companyName);
            await AsyncStorage.setItem("company_address", address);
            await AsyncStorage.setItem("company_phone", phoneNumber);
            await AsyncStorage.setItem("currency", currency);
            try {
              await AsyncStorage.setItem('language', selectedLanguage);
              updateLanguage(selectedLanguage); // Update global language
              Alert.alert(i18n.t('success'), i18n.t('settings_saved'));
            } catch (error) {
              console.error("Error saving settings:", error);
            }

            Alert.alert(i18n.t("success"), i18n.t("success_message"));
        } catch (error) {
            console.error("Error saving settings:", error);
        }
    };

    const clearAllSettings = async () => {
        Alert.alert(
            i18n.t("confirm_reset"), 
            i18n.t("are_you_sure_you_want_to_reset_all_settings"), 
            [
                { text: i18n.t("cancel"), style: "cancel" },
                {
                    text: i18n.t("reset"),
                    onPress: async () => {
                        try {
                            showMessage({
                                message: "Success",
                                description: "All settings cleared successfully.",
                                type: "success", // Corrected casing
                                duration: 2000,
                            });
                            // Remove specific keys
                            await AsyncStorage.multiRemove([
                                "company_name",
                                "company_address",
                                "company_phone",
                                "currency",
                                "language",
                                "restaurant_logo"
                            ]);
                           
    
                            // Reload app (only if using Expo)
                            if (Updates && Updates.reloadAsync) {
                                await Updates.reloadAsync();
                            }
    
                            
    
                        } catch (error) {
                            console.error("Error clearing settings:", error);
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };
    

    return (
        <BackgroundWrapper>
        <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
             <FlashMessage position="bottom"  style={{marginBottom:10,marginRight:10,marginLeft:10,marginBottom:10,borderRadius:10,height:60}}/>

            {/* Upload Logo */}
            <TouchableOpacity onPress={selectLogo} style={styles.logoContainer}>
                {logo ? (
                    <Image source={{ uri: logo }} style={styles.logo} />
                ) : (
                    <Text style={styles.uploadText}>{i18n.t('upload_logo')}</Text>
                )}
            </TouchableOpacity>

            {/* Company Name */}
            <Text style={styles.label}>{i18n.t('company_name')}</Text>
      <TextInput
      style={styles.input}
        placeholder={i18n.t('company_name')}
        value={companyName}
        onChangeText={setCompanyName} 
      />

            {/* Address */}
            <Text style={styles.label}>{i18n.t('address')}</Text>
            <TextInput
                style={styles.input}
                placeholder={i18n.t("enter_address")}
                value={address}
                onChangeText={setAddress}
            />

            {/* Phone Number */}
            <Text style={styles.label}>{i18n.t('phone_number')}</Text>
            <TextInput
                style={styles.input}
                placeholder={i18n.t("enter_phone_number")}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
            />

            {/* Currency Picker */}
            <Text style={styles.label}>{i18n.t('currency')}</Text>
            <Picker
                selectedValue={currency}
                onValueChange={setCurrency}
                style={styles.picker}
            >
                <Picker.Item label={i18n.t("lkr")} value="LKR" />
                <Picker.Item label={i18n.t("dollars")} value="Dollars" />
            </Picker>

            {/* Language Picker */}
            <Text style={styles.label}>{i18n.t('language')}</Text>
      <Picker
        selectedValue={selectedLanguage}
        onValueChange={setSelectedLanguage}
      >
        <Picker.Item label="English" value="en" />
        <Picker.Item label="සිංහල" value="si" />
        <Picker.Item label="தமிழ்" value="ta" />
      </Picker>

      {/* Enable App Lock Switch */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.label}>Enable App Lock</Text>
        <Switch
          value={lockEnabled}
          onValueChange={handleToggle}
        />
      </View>
<View style={{justifyContent:'center',alignItems:'center'}}>
            {/* Save Settings Button */}
            <TouchableOpacity onPress={saveSettings} style={styles.saveButton}>
            
                <Text style={styles.buttonText}>&nbsp;&nbsp;&nbsp;{i18n.t('save_settings')}</Text>
            </TouchableOpacity>

            {/* Reset Button */}
            <TouchableOpacity onPress={clearAllSettings} style={styles.resetButton}>
               
                <Text style={styles.buttonText}>&nbsp;&nbsp;&nbsp;{i18n.t("reset_all_settings")}</Text>
            </TouchableOpacity>
            </View>
        </ScrollView>
        </BackgroundWrapper> 
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    uploadText: {
        fontSize: 16,
        color: "gray",
    },
    label: {
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 10,
    },
    input: {
        padding: 12,
      
        borderBottomWidth: 1,
        borderColor: "#ccc",
        marginTop: 5,
    },
    saveButton: {
        backgroundColor: "black",
        padding: 10,
        borderRadius: 50,
        alignItems: "center",
        marginTop: 20,
        flexDirection: "row",
        justifyContent: "center",
        width: 300,
        maxWidth:400,
       
    },
    resetButton: {
        backgroundColor: "indianred",
        padding: 10,
        borderRadius: 50,
        alignItems: "center",
        marginTop: 18,
        flexDirection: "row",
        justifyContent: "center",
        width: 300,
        maxWidth:400,
        
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default SettingScreen;
