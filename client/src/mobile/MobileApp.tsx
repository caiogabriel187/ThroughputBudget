import React from "react";
import { View, Text, StyleSheet } from "react-native-web";
import { NavigationContainer, createNativeStackNavigator } from "./navigation";
import HomeScreen from "./screens/HomeScreen";
import HistoryScreen from "./screens/HistoryScreen";
import SaveScreen from "./screens/SaveScreen";
import DetailScreen from "./screens/DetailScreen";

const Stack = createNativeStackNavigator();

function BottomTabBar() {
  return null;
}

export default function MobileApp() {
  return (
    <View style={styles.appWrapper}>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>5G NR Calculator — React Native</Text>
      </View>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "Calculadora 5G NR" }}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{ title: "Histórico de Cálculos" }}
          />
          <Stack.Screen
            name="Save"
            component={SaveScreen}
            options={{ title: "Salvar Cenário" }}
          />
          <Stack.Screen
            name="Detail"
            component={DetailScreen}
            options={{ title: "Detalhes do Cenário" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  appWrapper: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  statusBar: {
    backgroundColor: "#0066cc",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
