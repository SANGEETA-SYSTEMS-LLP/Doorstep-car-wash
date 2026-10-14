import AppRoutes from "./routes/AppRoutes";

import { AuthProvider } from "./context/AuthContext";
import { BookingProvider } from "./context/BookingContext";
import { WasherProvider } from "./context/WasherContext";

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <WasherProvider>
          <AppRoutes />
        </WasherProvider>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;