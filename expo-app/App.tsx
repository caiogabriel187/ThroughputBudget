import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SaveScreen from './src/screens/SaveScreen';
import DetailScreen from './src/screens/DetailScreen';

export type RootStackParamList = {
  Tabs: undefined;
  Save: { calculationData: any };
  Detail: { calculation: any };
};

export type TabParamList = {
  Throughput: undefined;
  LinkBudget: undefined;
  Historico: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.iconText, focused && styles.iconFocused]}>{label}</Text>
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Throughput"
        component={HomeScreen}
        initialParams={{ mode: 'throughput' }}
        options={{
          title: 'Throughput',
          tabBarIcon: ({ focused }) => <TabIcon label="TP" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="LinkBudget"
        component={HomeScreen}
        initialParams={{ mode: 'linkbudget' }}
        options={{
          title: 'Link Budget',
          tabBarIcon: ({ focused }) => <TabIcon label="LB" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Historico"
        component={HistoryScreen}
        options={{
          title: 'Historico',
          tabBarIcon: ({ focused }) => <TabIcon label="HIS" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#0066cc' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen
            name="Tabs"
            component={TabNavigator}
            options={{ title: 'Calculadora 5G NR', headerShown: true }}
          />
          <Stack.Screen
            name="Save"
            component={SaveScreen}
            options={{ title: 'Salvar Cenario' }}
          />
          <Stack.Screen
            name="Detail"
            component={DetailScreen}
            options={{ title: 'Detalhes do Cenario' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  iconFocused: {
    color: '#0066cc',
  },
});
