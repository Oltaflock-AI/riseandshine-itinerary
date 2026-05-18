import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rise & Shine — AI Itinerary Generator",
  description: "Live-data, hour-by-hour itineraries for Rise & Shine Travel, Ahmedabad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
