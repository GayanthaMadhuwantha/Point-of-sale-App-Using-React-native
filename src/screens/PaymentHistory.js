import React, { useState, useEffect } from 'react';
import { View, Text, Modal, FlatList, Button, StyleSheet,TouchableWithoutFeedback } from 'react-native';
import{getbalance, getpaymenthistory} from '../services/database';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

const PaymentHistory = ({ customerId ,visible, onClose}) => {
  const [balance, setBalance] = useState(0);
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    const data = await getbalance(customerId);
    setBalance(data);
  };

  const fetchPayments = async () => {
    setLoading(true);
    const data = await getpaymenthistory(customerId);
      setPayments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBalance();
    fetchPayments(1);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPayments(nextPage);
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="fade" transparent>
        <TouchableWithoutFeedback   onPress={onClose}>
      <Text>Balance: Rs.{balance.toFixed(2)}</Text>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>Date: {item.payment_date}</Text>
            <Text>Cash: ${item.cash_amount}</Text>
            <Text>Check: ${item.check_amount}</Text>
            <Text>Credit: ${item.credit_amount}</Text>
          </View>
        )}
      />
      <Button title="Show More" onPress={loadMore} disabled={loading} />
      </TouchableWithoutFeedback>
    </Modal>
  );
};
const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
    },
    modalButton: {
      marginTop: 10,
    },
  });
export default PaymentHistory;