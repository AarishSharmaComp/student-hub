import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="section-label">404 · Page not found</p>
        <h1 className="text-2xl font-semibold">
          This page isn't in your workspace.
        </h1>
        <p className="text-sm text-muted-foreground">
          Check the address or return to your overview.
        </p>
        <Button asChild>
          <Link to="/">Back to Student Hub</Link>
        </Button>
      </div>
    </div>
  );
}
