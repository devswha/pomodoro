import { UserProvider } from '../lib/contexts/UserContext';
import { RealtimeProvider } from '../lib/contexts/RealtimeContext';
import './globals.css';
import ClientLayout from '../lib/components/ClientLayout';

export const metadata = {
  title: 'Pomodoro Timer v1.0.1 - Real-time Sync',
  description: 'Modern React-based pomodoro timer with real-time sync, multi-device support, and collaborative features',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <RealtimeProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </RealtimeProvider>
        </UserProvider>
      </body>
    </html>
  );
}