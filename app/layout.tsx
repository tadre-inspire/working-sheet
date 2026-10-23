import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";
import { Sora } from "next/font/google";
import "./globals.css";

// One family for everything; display and body share the same variable.
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // draw under the phone notch; screens add safe-area padding
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0a" },
  ],
};

export const metadata: Metadata = {
  applicationName: "Working Sheet",
  appleWebApp: { capable: true, title: "Working Sheet", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { url: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/pwa-icon/180", sizes: "180x180", type: "image/png" }],
  },
  title: "Working Sheet — plan, price, publish",
  description:
    "A Notion-style workspace for creatives: working sheets, AI tool pricing, news and portfolios.",
};

// Runs before paint so the saved theme never flashes.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
