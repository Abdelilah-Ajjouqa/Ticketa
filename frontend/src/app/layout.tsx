import "./globals.css";
import StoreProvider from "@/app/StoreProvider";
import Navbar from "@/components/Navbar";
import AuthInitializer from "@/components/AuthInitializer";

export const metadata = {
  title: "Ticketa - Event Booking Platform",
  description: "Book tickets for your favorite events with Ticketa",
};

export const viewport = {
  themeColor: "#4f46e5",
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 to-slate-100">
        <StoreProvider>
          <AuthInitializer>
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
              {children}
            </main>
            <footer className="bg-slate-800 text-slate-300 mt-12">
              <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="text-center text-sm">
                  <p>&copy; 2026 Ticketa. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </AuthInitializer>
        </StoreProvider>
      </body>
    </html>
  );
}
