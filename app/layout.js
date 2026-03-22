export const metadata = {
  title: 'Excel Processor',
  description: 'Process Excel files to extract names and prices',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  )
}