import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Modal, ImageBackground, Alert, StyleSheet, BackHandler, TouchableOpacity, Platform, ActivityIndicator
} from "react-native";
import * as Notifications from "expo-notifications";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { LanguageProvider } from './src/LanguageContext';
import i18n from './src/i18n';
import DashboardScreen from "./src/screens/DashboardScreen";
import InventoryScreen from "./src/screens/InventoryScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import SettingsScreen from "./src/screens/SettingScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomDrawer from "./src/components/CustomDrawer";
import GRNScreen from "./src/screens/GRNScreen";
import PaymentScreen from "./src/screens/PaymentScreen";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import { checkDuePayments } from "./src/services/database"
import AuthScreen from './src/screens/AuthScreen';
import { getLockPreference, authenticate } from './src/services/Authentication';
import LoadingOverlay from "./src/components/LoadingOverlay";
import BackgroundWrapper from "./src/components/BackgroundWrapper";

// Firebase imports
import { initializeApp } from "firebase/app";
import { getFirestore, doc, runTransaction } from "firebase/firestore"; // Added transaction
import WalletScreen from "./src/screens/WalletScreen";

// Initialize Firebase with correct configuration
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Drawer = createDrawerNavigator();

const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    alert("Enable notifications to receive payment due reminders.");
  }
};

// Schedule Notification
const scheduleNotification = async (message, dueDate) => {
  const triggerTime = new Date(dueDate).getTime();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Payment Reminder",
      body: message,
      sound: "default",
    },
    trigger: { seconds: (triggerTime - Date.now()) / 1000 }, // Correct format
  });
};

const App = () => {
  const [status, setStatus] = useState("loading");
  const [modalVisible, setModalVisible] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [isActivating, setIsActivating] = useState(false); // Loading state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  //const [lockEnabled, setLockEnabled] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);



  const LoadingOverlays = () => (
    <View style={styles.loadingContainer}>
      <LoadingOverlay/>
    </View>
  );




  useEffect(() => {
    const checkAuth = async () => {
      try {
        const enabled = await getLockPreference();
        if (enabled) {
          setAuthModalVisible(true);
          const success = await authenticate();
          setIsAuthenticated(success);
        } else {
          setAuthModalVisible(false);
          setIsAuthenticated(true);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);



  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await checkTrialStatus();
        console.log("Trial Status:", result);
        setStatus(result);

        if (result === "trial") {
          Alert.alert(i18n.t('message'), i18n.t("trai_application"));
        } else if (result === "expired") {
          setModalVisible(true);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to check app status");
      }
    };

    checkStatus();
  }, []);

  const fetchDuePayments = async () => {
    const duePayments = await checkDuePayments();
    duePayments.forEach(({ message, dueDate }) => {
      scheduleNotification(message, dueDate);
    });
  };

  // Effect Hook to Initialize Notifications
  useEffect(() => {
    const initNotifications = async () => {
      await requestNotificationPermission(); // Ensure permission is granted first
      await fetchDuePayments();
    };
    initNotifications();
  }, []);

  const checkTrialStatus = async () => {
    try {
      const [firstOpen, activated] = await Promise.all([
        AsyncStorage.getItem("firstOpenDate"),
        AsyncStorage.getItem("isActivated")
      ]);

      if (activated === "true") return "activated";

      if (!firstOpen) {
        await AsyncStorage.setItem("firstOpenDate", new Date().toISOString());
        return "trial";
      }

      const trialEndDate = new Date(firstOpen);

      trialEndDate.setDate(trialEndDate.getDate() + 30);
      return Date.now() > trialEndDate.getTime() ? "expired" : "trial";
    } catch (error) {
      console.error("Error checking trial:", error);
      return "trial";
    }
  };

  const activateApp = async (enteredCode) => {
    try {
      const codeDocRef = doc(db, "activationCodes", enteredCode);

      await runTransaction(db, async (transaction) => {
        const codeDoc = await transaction.get(codeDocRef);

        if (!codeDoc.exists() || codeDoc.data().used) {
          throw new Error("Invalid or used code");
        }

        transaction.update(codeDocRef, { used: true });
      });

      await AsyncStorage.setItem("isActivated", "true");
      return { success: true };
    } catch (error) {
      console.error("Activation error:", error);
      return {
        success: false,
        message: error.message || "Activation failed. Try again."
      };
    }
  };

  const handleActivation = async () => {
    if (!activationCode.trim()) return;

    setIsActivating(true);
    const result = await activateApp(activationCode);
    setIsActivating(false);

    if (result.success) {
      setModalVisible(false);
      setStatus("activated");
      Alert.alert("Success", "App activated successfully!");
    } else {
      Alert.alert("Error", result.message, [
        { text: "OK" },
        status === "expired"
          ? { text: "Exit", onPress: () => BackHandler.exitApp() } // Exit if trial expired
          : { text: "Retry" } // Allow retry if in trial mode
      ]);
    }
  };

  return (    
    <View style={styles.container}>
      {status === "loading" ? (
        <LoadingOverlays />
      ) : (
        <View style={styles.contentContainer}>
          <LanguageProvider>
          <BackgroundWrapper>
            <NavigationContainer style={{backgroundColor:'red'}} >
            
              {isAuthenticated ? (
                <Drawer.Navigator drawerContent={(props) => <CustomDrawer {...props} />}
                  initialRouteName="Dashboard"
                  screenOptions={{
                    drawerStyle: { backgroundColor: "rgb(255, 227, 238)",width: 300 }, // Drawer background
                    drawerActiveTintColor: 'rgb(245, 139, 162)', // Active text color
                    drawerInactiveTintColor: 'rgb(0, 0, 0)', // Inactive text color
                    drawerActiveBackgroundColor: '#333', // Background for active item
                    drawerItemStyle: { marginVertical: 10, borderTopLeftRadius:10, borderBottomLeftRadius:10 },
                    headerRight: () =>
                      status !== "activated" ? (
                        <TouchableOpacity
                          onPress={() => setModalVisible(true)}
                          style={styles.activateButton}
                        >
                          <Text style={styles.activateText}>Activate Now</Text>
                        </TouchableOpacity>
                      ) : null,
                    headerTitleAlign: "center",
                  }}
                >
                
                  <Drawer.Screen value="Dashboard" name="Dashboard" component={DashboardScreen} options={{
                    drawerIcon: ({ color, size }) => (
                      <MaterialIcons name="space-dashboard" size={size} color={color} />
                    ),
                  }} />
                  
                  <Drawer.Screen name="Inventory" component={InventoryScreen} options={{
                    drawerIcon: ({ color, size }) => (
                      <MaterialIcons name="inventory" size={size} color={color} />
                    ),
                  }} />
                  <Drawer.Screen name="Reports" component={ReportsScreen}
                    options={{
                      drawerIcon: ({ color, size }) => (
                        <AntDesign name="areachart" size={size} color={color} />
                      ),
                    }} />

                  <Drawer.Screen name="GRN" component={GRNScreen}
                    options={{
                      drawerIcon: ({ color, size }) => (
                        <MaterialIcons name="receipt" size={size} color={color} />
                      ),
                    }} />
                  <Drawer.Screen name="Payment" component={PaymentScreen}
                    options={{
                      drawerIcon: ({ color, size }) => (
                        <MaterialIcons name="payment" size={size} color={color} />
                      ),
                    }} />

                 <Drawer.Screen name="Wallet" component={WalletScreen}
                    options={{
                      drawerIcon: ({ color, size }) => (
                        <MaterialIcons name="wallet" size={size} color={color} />
                      ),
                    }} />

                  <Drawer.Screen name="Settings" component={SettingsScreen}
                    options={{
                      drawerIcon: ({ color, size }) => (
                        <MaterialIcons name="settings" size={size} color={color} />
                      ),
                    }} />

                </Drawer.Navigator>
                
              ) : (
                <AuthScreen visible={authModalVisible} onClose={()=>setAuthModalVisible(false)} setIsAuthenticated={setIsAuthenticated} /> // ✅ Should be inside NavigationContainer
              )}
              
            </NavigationContainer>
            </BackgroundWrapper>
          </LanguageProvider>
          <View>
            <Modal visible={modalVisible} animationType="fade" transparent>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Activate App</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter activation code"
                    value={activationCode}
                    onChangeText={setActivationCode}
                    autoCapitalize="none"
                    editable={!isActivating}
                  />
                  <TouchableOpacity
                    onPress={handleActivation}
                    style={styles.paymentButton}
                    disabled={isActivating}
                  >
                    <Text style={{ color: "white" }}>{isActivating ? "Activating..." : "Activate"}</Text>
                  </TouchableOpacity>

                  {/* Close button for trial users */}
                  {status === "trial" && (
                    <>
                      <TouchableOpacity
                        onPress={() => setModalVisible(false)}
                        style={styles.closeButton}
                      >
                        <Text style={styles.closeText}>Continue Trial</Text>

                      </TouchableOpacity>
                      <Text style={styles.contact}>(If You Are Having Issue Please contact 077&nbsp;116&nbsp;8439)</Text></>
                  )}

                  {/* Force app exit if trial expired */}
                  {status === "expired" && (
                    <TouchableOpacity
                      onPress={() => BackHandler.exitApp()}
                      style={styles.exitButton}
                    >
                      <Text style={styles.exitText}>Exit App</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Modal>

          </View>
        </View>
      )}
    </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: 'cover', // Ensures the image covers the whole screen
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa'
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#2c3e50'
  },
  paymentButton: {
    flexDirection: "row",
    justifyContent: 'center',
    backgroundColor: "black",
    padding: 10,
    alignItems: "center",
    shadowColor: "#27AE60",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 10,
    borderRadius: 50
  },
  closeButton: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: 'center'
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.5)" 
  },
  modalContent: { 
    backgroundColor: "rgb(255, 227, 238)",
    padding: 20, 
    borderRadius: 10 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,

    borderRadius: 50,
    marginTop: 10,
  },
  activateButton: {
    marginRight: 15,
    padding: 10
  },
  activateText: {
    fontWeight: "bold",
    color: 'in',
  },
  modalTitle: {
    fontSize: 15,
    marginTop: 0,
    fontWeight: "bold",
    textAlign: "center"
  },
  contact: {
    marginTop: 20,
    fontWeight: 'bold',
    color: 'indianred',
    textAlign: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeText: {
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default App;