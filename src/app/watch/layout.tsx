export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-full p-0 m-0 overflow-hidden">
      {children}
    </div>
  );
}
