import React from "react";
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
} from "react-native-web";

type Props = {
  message?: string;
  size?: "small" | "large";
  color?: string;
};

export default function LoadingIndicator({
  message = "Carregando...",
  size = "large",
  color = "#0066cc",
}: Props) {
  return (
    <View style={styles.container} testID="loading-indicator">
      <ActivityIndicator size={size} color={color} testID="activity-indicator" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
