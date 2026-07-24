import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../src/theme';

export default function SprintScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sprint Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: theme.colors.text,
    fontSize: 20,
  }
});
