import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planner",
  description: "Plan trainings and regattas.",
};

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
