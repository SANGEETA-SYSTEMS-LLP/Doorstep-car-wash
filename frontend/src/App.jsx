import AppRoutes from "./routes/AppRoutes";

import { BookingProvider } from "./context/BookingContext";
import { WasherProvider } from "./context/WasherContext";

function App() {
  return (
    <BookingProvider>
      <WasherProvider>
        <AppRoutes />
      </WasherProvider>
    </BookingProvider>
  );
}

export default App;