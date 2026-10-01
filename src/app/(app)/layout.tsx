import { Nav } from "@/components/Nav";
import { RequireAuth } from "@/components/RequireAuth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Nav />
      <main className="container">{children}</main>
    </RequireAuth>
  );
}
