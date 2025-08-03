import "./global.css";
import { ReactNode } from "react";

export const metadata = {
  title: "F1GPT",
  description: "Ask me anything about Formula 1!",
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
