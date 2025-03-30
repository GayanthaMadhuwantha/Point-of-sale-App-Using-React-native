import { View, ScrollView, Text, StyleSheet,RefreshControl } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { fetchFinancialSummary, fetchPaymentSummary,getAllPayments } from '../services/database';
import { FontAwesome5 } from "@expo/vector-icons";
import BackgroundWrapper from "../components/BackgroundWrapper";

const WalletScreen = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    profit: 0,
    credit: 0,
    cash: 0,
    checks: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [financialData, paymentData] = await Promise.all([
        fetchFinancialSummary(),
        fetchPaymentSummary(),
        getAllPayments()
      ]);

      setStats({
        revenue: financialData.revenue || 0,
        profit: financialData.profit || 0,
        credit: paymentData.credit || 0,
        cash: paymentData.cash || 0,
        checks: paymentData.checks || 0
      });
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => {
        setRefreshing(false);
    }, 2000); // Simulating API fetch
};

  useEffect(() => {
    loadData();
  }, [loadData]);
  const HighlightCard = ({ title, value, color }) => (
    <View style={[styles.highlightCard, { backgroundColor: color }]}>
      <View style={styles.highlightTextContainer}>
        <Text style={styles.highlightCardTitle}>{title}</Text>
        <Text style={styles.highlightCardValue}>Rs. {value.toFixed(2)}</Text>
        <Text style={styles.highlightCardSubtitle}>Last 30 days</Text>
      </View>
      <View style={styles.highlightIcon}>
        <FontAwesome5 
          name={title.includes('Profit') ? 'chart-line' : 'money-bill-wave'} 
          size={32} 
          color="rgba(255,255,255,0.3)"
        />
      </View>
    </View>
  );

  const StatCard = ({ title, value, color }) => (
    <View style={[styles.card, { backgroundColor: '#fff', borderLeftColor: color }]}>
      <Text style={[styles.cardTitle, { color }]}>{title}</Text>
      <Text style={[styles.cardValue, { color: '#333' }]}>Rs. {value.toFixed(2)}</Text>
    </View>
  );

  return (
    <BackgroundWrapper>
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      
      
      {/* Highlight Section */}
      <View style={styles.highlightContainer}>
        <HighlightCard 
          title="Total Revenue" 
          value={stats.revenue} 
          color="rgb(240, 114, 114)"
        />
        <HighlightCard 
          title="Total Profit" 
          value={stats.profit} 
          color="rgb(100, 100, 100)"
        />
      </View>

      {/* Other Stats */}
      <Text style={styles.subHeader}>Payment Breakdown</Text>
      <View style={styles.grid}>
        <StatCard title="Credit" value={stats.credit} color="#FF9800"  style={{borderLeftColor: 'rgb(207, 54, 54)'}}/>
        <StatCard title="Cash" value={stats.cash} color="#009688" />
        <StatCard title="Checks" value={stats.checks} color="#9C27B0" />
        <StatCard 
          title="Total Balance" 
          value={stats.cash + stats.checks + stats.credit} 
          color="#E91E63" 
        />
      </View>
    </ScrollView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 24,
    color: '#2c3e50',
    letterSpacing: -0.5,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 16,
    color: '#34495e',
  },
  highlightContainer: {
    marginBottom: 24,
  },
  highlightCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  highlightTextContainer: {
    flex: 1,
  },
  highlightCardTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginBottom: 8,
  },
  highlightCardValue: {
    fontSize: 28,
    color: 'white',
    fontWeight: '800',
    marginBottom: 4,
  },
  highlightCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  highlightIcon: {
    marginLeft: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    
  },
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'red',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default WalletScreen;
