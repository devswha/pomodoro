import { UserProvider } from '../lib/contexts/UserContext';
import './globals.css';
import ClientLayout from '../lib/components/ClientLayout';

export const metadata = {
  title: 'Pomodoro Timer v4.0.0',
  description: 'Modern React-based pomodoro timer application with minimalist black & white design',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </UserProvider>
      </body>
    </html>
  );
}