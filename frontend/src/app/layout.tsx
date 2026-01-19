import "@/styles/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body className="bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
