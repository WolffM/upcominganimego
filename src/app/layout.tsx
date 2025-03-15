import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Upcoming Anime",
  description: "Discover upcoming anime releases with trailers",
};

// Script to handle dark mode without hydration issues
const DarkModeScript = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              // Remove any darkreader attributes that might cause hydration issues
              const html = document.documentElement;
              if (html.hasAttribute('data-darkreader-mode')) {
                html.removeAttribute('data-darkreader-mode');
              }
              if (html.hasAttribute('data-darkreader-scheme')) {
                html.removeAttribute('data-darkreader-scheme');
              }
              
              // Log the action
              console.info('[AnimeApp] [INFO][DarkMode] Removed darkreader attributes to prevent hydration issues');
            } catch (e) {
              console.error('[AnimeApp] [ERROR][DarkMode] Error handling dark mode:', e);
            }
          })();
        `,
      }}
    />
  );
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <DarkModeScript />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
