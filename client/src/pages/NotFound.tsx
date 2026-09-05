import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md text-center p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-lime-300 mb-6">
          404
        </p>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-lime-300/10 rounded-full animate-pulse" />
            <AlertTriangle className="relative h-16 w-16 text-lime-300" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-slate-50 mb-2">Page Not Found</h1>

        <p className="text-slate-300 mb-8 leading-relaxed">
          Sorry, the page you are looking for doesn't exist.
          <br />
          It may have been moved or deleted.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleGoHome}
            variant="default"
            size="lg"
            className="bg-lime-300 hover:bg-lime-300/90 text-slate-950 px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </main>
  );
}
