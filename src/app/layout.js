import "./globals.css";

export const metadata = {
  title: "Drachenboot Planer",
  description: "Team Manager & Bootsplaner",
  manifest: "/manifest.json", // Verknüpfung zum Manifest
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Drachenboot Planer",
  },
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Verhindert Zoomen in der App-Ansicht (wirkt nativer)
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
