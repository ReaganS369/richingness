import { StyleSheet, Text, View } from 'react-native';
import { formatPaiseToRupees } from '@repo/shared';

export default function HomeScreen() {
  const demoAmount = formatPaiseToRupees(500000n); // ₹5000.00

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Richingness</Text>
      <Text style={styles.subtitle}>Give Every Rupee a Purpose.</Text>
      <Text style={styles.info}>Demo Balance: ₹{demoAmount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EDEDF8',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#8B8BA7',
    marginBottom: 20
  },
  info: {
    fontSize: 18,
    color: '#22D3A5',
    fontWeight: '600'
  }
});
