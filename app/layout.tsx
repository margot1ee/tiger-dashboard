import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Tiger Research Dashboard",
  description: "Social channel & traffic analytics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex font-pretendard">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-muted/30">
          <div className="p-6 max-w-[1400px] mx-auto">{children}</div>
        </main>
      </body>
    </html>
  );
}
