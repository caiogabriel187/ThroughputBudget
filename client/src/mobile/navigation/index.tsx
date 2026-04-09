import React, { createContext, useContext, useState, useCallback } from "react";
import { View, StyleSheet } from "react-native-web";

type Route = {
  name: string;
  params?: Record<string, any>;
};

type NavigationContextType = {
  currentRoute: Route;
  navigate: (name: string, params?: Record<string, any>) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  setOptions: (options: { title?: string }) => void;
  screenOptions: Record<string, { title?: string }>;
};

const NavigationContext = createContext<NavigationContextType | null>(null);

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within NavigationContainer");
  return ctx;
}

export function useRoute() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useRoute must be used within NavigationContainer");
  return ctx.currentRoute;
}

type ScreenConfig = {
  name: string;
  component: React.ComponentType<any>;
  options?: { title?: string };
};

type NavigationContainerProps = {
  children: React.ReactNode;
  initialRouteName?: string;
};

let registeredScreens: ScreenConfig[] = [];

export function createNativeStackNavigator() {
  function Navigator({
    children,
    initialRouteName,
  }: {
    children: React.ReactNode;
    initialRouteName?: string;
  }) {
    const screens: ScreenConfig[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === Screen) {
        screens.push({
          name: child.props.name,
          component: child.props.component,
          options: child.props.options,
        });
      }
    });
    registeredScreens = screens;

    const firstScreen = initialRouteName || screens[0]?.name || "";
    const [history, setHistory] = useState<Route[]>([{ name: firstScreen }]);
    const [screenOptions, setScreenOptions] = useState<Record<string, { title?: string }>>({});
    const currentRoute = history[history.length - 1];

    const navigate = useCallback((name: string, params?: Record<string, any>) => {
      setHistory((prev) => [...prev, { name, params }]);
    }, []);

    const goBack = useCallback(() => {
      setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }, []);

    const canGoBack = useCallback(() => history.length > 1, [history]);

    const setOptions = useCallback(
      (options: { title?: string }) => {
        setScreenOptions((prev) => ({
          ...prev,
          [currentRoute.name]: options,
        }));
      },
      [currentRoute.name]
    );

    const screen = screens.find((s) => s.name === currentRoute.name);
    const ScreenComponent = screen?.component;

    return (
      <NavigationContext.Provider
        value={{ currentRoute, navigate, goBack, canGoBack, setOptions, screenOptions }}
      >
        <View style={navStyles.container}>
          {ScreenComponent ? (
            <ScreenComponent route={currentRoute} navigation={{ navigate, goBack, canGoBack, setOptions, screenOptions }} />
          ) : null}
        </View>
      </NavigationContext.Provider>
    );
  }

  function Screen(_props: {
    name: string;
    component: React.ComponentType<any>;
    options?: { title?: string };
  }) {
    return null;
  }

  return { Navigator, Screen };
}

export function NavigationContainer({ children }: NavigationContainerProps) {
  return <View style={navStyles.root}>{children}</View>;
}

const navStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
