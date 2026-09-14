import { createFileRoute } from "@tanstack/react-router";
import { ComparisonApp } from "@/components/comparison-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <ComparisonApp />;
}
