import "./globals.css";
import StoreProvider from "@/app/StoreProvider";
import Navbar from "@/components/Navbar";
import AuthInitializer from "@/components/AuthInitializer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <StoreProvider>
          <AuthInitializer>
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </AuthInitializer>
        </StoreProvider>
      </body>
    </html>
  );
}
