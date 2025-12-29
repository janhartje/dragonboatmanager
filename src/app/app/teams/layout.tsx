import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teams",
  description: "Manage your dragon boat teams, crews, and paddlers.",
};

export default function TeamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
