import { AppInitializer } from "@/components/AppInitializer";
import { store } from "@/store";
import { Stack } from "expo-router";
import { Provider } from "react-redux";
import "../../global.css";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppInitializer>
        <Stack screenOptions={{ headerShown: false }} />
      </AppInitializer>
    </Provider>
  );
}
