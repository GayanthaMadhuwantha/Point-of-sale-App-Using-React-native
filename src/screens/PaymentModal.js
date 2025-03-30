
import React, { useState, useEffect, useContext} from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
   StyleSheet,
    Modal,ScrollView, Dimensions
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    fetchPaymentDetails,
    fetchOrderspayment,
    savePayment
} from "../services/database";
import Ionicons from '@expo/vector-icons/Ionicons';
import { LanguageContext } from '../LanguageContext';
import i18n from '../i18n'

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768; // 
const PaymentModal = ({visible, onClose, orderId, total, setOrders}) => {

    const { language } = useContext(LanguageContext);

    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [paymentType, setPaymentType] = useState("");
    const [orderAmount, setOrderAmount] = useState(0);
    const [showCheckDatePicker, setShowCheckDatePicker] = useState(false);
    const [formState, setFormState] = useState({
        amountGiven: orderAmount,
        creditPeriod: "",
        creditEndDate: new Date(),
        checkNumber: "",
        checkEndDate: new Date(),
        customCash: "",
        customCheck: "",
        customCredit: ""
    });

    useEffect(() => {
        setSelectedOrderId(orderId);
        fetchAmountDetails(orderId);
    }, [orderId]);

    const fetchAmountDetails = async (orderId) => {

            const details = await fetchPaymentDetails(orderId);
            if (details) {
               setOrderAmount(details.total);
            }
    }
    const handleSavePayment = async () => {
        const success = await savePayment({
            orderId: selectedOrderId,
            paymentType,
            ...formState
        });

        if (success) {
            onClose();
            const updatedOrders = await fetchOrderspayment();
            setOrders(updatedOrders);
        }
    };


    return (
        <Modal visible={visible} onRequestClose={onClose} transparent animationType="fade">

            <View style={styles.modalBackdrop}>
                <View style={styles.modalContent} >
                    <ScrollView >
                        <View style={{ justifyContent: "space-between", flexDirection: 'row' }}>
                            <Text style={styles.modalHeader}>{i18n.t('complete_payment')} #{selectedOrderId}</Text>
                            <TouchableOpacity pointerEvents="auto" onPress={onClose}><Ionicons name="close" size={24} color="black" /></TouchableOpacity>
                        </View>
                        <Picker
                            selectedValue={paymentType}
                            onValueChange={setPaymentType}
                        >
                            <Picker.Item label={i18n.t('select_payment_type')} value="" />
                            <Picker.Item label={i18n.t("Cash")} value="Cash" />
                            <Picker.Item label={i18n.t("Credit")} value="Credit" />
                            <Picker.Item label={i18n.t("Check")} value="Check" />
                            <Picker.Item label={i18n.t("Custom")} value="Custom" />
                        </Picker>


                        {paymentType === "Cash" && (
                            <TextInput
                                style={styles.input}
                                placeholder={i18n.t("amount_received")}
                                keyboardType="numeric"
                                value={orderAmount}
                                onChangeText={text => setFormState(prev => ({ ...prev, amountGiven: text }))}
                            />
                        )}

                        {paymentType === "Credit" && (
                            <>
                                <TextInput
                                    style={styles.input}
                                    placeholder={i18n.t("credit_period")}
                                    keyboardType="numeric"
                                    value={formState.creditPeriod}
                                    onChangeText={text => setFormState(prev => ({ ...prev, creditPeriod: text }))}
                                />
                                <Text style={{ color: 'black', fontWeight: 'bold', textAlign: 'center', marginTop: 5 }}>
                                    End Date: {formState.creditEndDate.toLocaleDateString()}
                                </Text>
                            </>
                        )}

                        {paymentType === "Check" && (
                            <>
                                <TextInput
                                    style={styles.input}
                                    placeholder={i18n.t("check_number")}
                                    value={formState.checkNumber}
                                    onChangeText={text => setFormState(prev => ({ ...prev, checkNumber: text }))}
                                />
                                {/* Button to open DateTimePicker */}
                                <TouchableOpacity pointerEvents="auto" onPress={() => setShowCheckDatePicker(true)} style={styles.dateText}>
                                    <Text style={{ color: 'black', fontWeight: 'bold', textAlign: 'center',marginTop: 5 }} >
                                        {i18n.t('select_checks_end_date')}: {formState.checkEndDate.toLocaleDateString()}
                                    </Text>
                                </TouchableOpacity>
                                {showCheckDatePicker && (
                                    <DateTimePicker
                                        value={formState.checkEndDate}
                                        mode="date"
                                        display="default"
                                        onChange={(_, date) => {
                                            if (date) {
                                                setFormState(prev => ({ ...prev, checkEndDate: date }));
                                            }
                                            setShowCheckDatePicker(false);
                                        }}
                                    />
                                )}
                            </>
                        )}


                        {paymentType === "Custom" && (
                            <>
                                <Text style={styles.text}>Cash</Text>
                                <View style={styles.horizontalLine} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={i18n.t('cash_amount')}
                                    keyboardType="numeric"
                                    value={formState.customCash}
                                    
                                    onChangeText={text => setFormState(prev => ({ ...prev, customCash: text }))}
                                />
                                <Text style={[styles.text, styles.margintext]}>Check</Text>
                                <View style={styles.horizontalLine} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={i18n.t("check_amount")}
                                    keyboardType="numeric"
                                    value={formState.customCheck}
                                    onChangeText={text => setFormState(prev => ({ ...prev, customCheck: text }))}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder={i18n.t("check_number")}
                                    value={formState.checkNumber}
                                    onChangeText={text => setFormState(prev => ({ ...prev, checkNumber: text }))}
                                />
                                {/* Button to open DateTimePicker */}
                                <TouchableOpacity pointerEvents="auto" onPress={() => setShowCheckDatePicker(true)} style={styles.dateText}>
                                    <Text style={{ color: 'black', fontWeight: 'bold', textAlign: 'center', marginTop: 5, }} >
                                        {i18n.t('select_checks_end_date')}: {formState.checkEndDate.toLocaleDateString()}
                                    </Text>
                                </TouchableOpacity>
                                {showCheckDatePicker && (
                                    <DateTimePicker
                                        value={formState.checkEndDate}
                                        mode="date"
                                        display="default"
                                        onChange={(_, date) => {
                                            if (date) {
                                                setFormState(prev => ({ ...prev, checkEndDate: date }));
                                            }
                                            setShowCheckDatePicker(false);
                                        }}
                                    />
                                )}
                                <Text style={[styles.text, styles.margintext]}>Credit</Text>
                                <View style={styles.horizontalLine} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={i18n.t("credit_amount")}
                                    keyboardType="numeric"
                                    value={formState.customCredit}
                                    onChangeText={text => setFormState(prev => ({ ...prev, customCredit: text }))}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder={i18n.t("credit_period")}
                                    keyboardType="numeric"
                                    value={formState.creditPeriod}
                                    onChangeText={text => setFormState(prev => ({ ...prev, creditPeriod: text }))}
                                />
                                <Text style={{ color: 'black', fontWeight: 'bold', marginTop: 5, textAlign: 'center' }}>
                                    {i18n.t("end_date")} {formState.creditEndDate.toLocaleDateString()}
                                </Text>
                            </>
                        )}

                        <View style={styles.buttonRow}>
                            <TouchableOpacity pointerEvents="auto"
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={onClose}
                            >
                                <Text style={styles.cabuttonText}>{i18n.t('cancel')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSavePayment}
                            >
                                <Text style={styles.sabuttonText}>{i18n.t('save_payment')}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>

        </Modal>
    )
};
const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: "rgb(255, 227, 238)",
        width: isTablet ? '70%' : '90%',
        maxWidth: 600,
        borderRadius: 12,
        padding: width * 0.05
    },
    modalHeader: {
        fontSize: isTablet ? 22 : 18,
        fontWeight: '700',
        marginBottom: height * 0.02,
        color: '#2c3e50',
        textAlign: 'center'
    },
    picker: {
        backgroundColor: '#ecf0f1',
        borderRadius: 50,
        marginBottom: height * 0.02
    },
    input: {
        borderColor: '#bdc3c7',
        borderBottomWidth: 1,
borderRadius:10,
        paddingHorizontal: 15,
        marginBottom: height * 0.01,
        fontSize: 14,
    },
    buttonRow: {
        flexDirection: 'row',
    justifyContent:'flex-end',
        marginTop: height * 0.02,
        gap:30
    },
    modalButton: {
       
        paddingTop: 12,
        paddingBottom: 12,
        borderRadius: 8,
        
        marginHorizontal: 5
    },
    cancelButton: {

        borderRadius: 50,
    },
    saveButton: {

        borderRadius: 50,
    },
    closeButton: {
        backgroundColor: 'black',
        padding: 20,
        borderRadius: 50,

    },
    cabuttonText: {
        color: "rgb(253, 41, 41)",
        fontWeight: '600',
        fontSize: 16
    },
    sabuttonText: {
        color: 'black',
        fontWeight: '600',
        fontSize: 16
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: '#ecf0f1'
    },
    detailLabel: {
        fontSize: 16,
        color: '#7f8c8d',
        fontWeight: '500'
    },
    detailValue: {
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '600'
    },
    loadingText: {
        textAlign: 'center',
        color: '#95a5a6',
        fontSize: 16,
        marginVertical: 20
    },
    horizontalLine: {
        width: '100%', // Full width
        height: 1, // Thickness of the line
        backgroundColor:'rgb(0, 0, 0)', // Color of the line
        marginVertical: 10, // Space above and below the line
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color:'rgb(0, 0, 0)'
    },
    margintext: {
        marginTop: 10,
    },
});
export default PaymentModal;