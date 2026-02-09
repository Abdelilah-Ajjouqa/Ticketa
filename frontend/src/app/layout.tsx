import "./globals.css";
import StoreProvider from "@/app/StoreProvider";
import Navbar from "@/components/Navbar";
import AuthInitializer from "@/components/AuthInitializer";

export const metadata = {
  title: 'Ticketa - Event Booking Platform',
  description: 'Discover and book amazing events near you',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-dark-primary min-h-screen antialiased text-light">
        <StoreProvider>
          <AuthInitializer>
            <Navbar />
            {children}
          </AuthInitializer>
        </StoreProvider>
      </body>
    </html>
  );
}
