import "@/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/server/auth";

export const metadata: Metadata = {
	title: "StreamHub - All Your Streaming Content in One Place",
	description: "Discover and stream movies and TV shows from multiple platforms in one place.",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await auth();

	return (
		<html lang="en" className={`${geist.variable}`}>
			<body className="min-h-screen bg-background font-sans antialiased">
				<TRPCReactProvider>
					<div className="relative flex min-h-screen flex-col">
						<SiteHeader user={session?.user} />
						<main className="flex-1">{children}</main>
						<SiteFooter />
					</div>
					<Toaster />
				</TRPCReactProvider>
			</body>
		</html>
	);
}
