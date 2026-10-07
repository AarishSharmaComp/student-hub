import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { User } from "@/types/student";
import { api, loadData, clearData, ApiError } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2 } from "lucide-react";

interface AuthContextType {
  user: User | null;
  demo: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const initialize = useCallback(async () => {
    sessionStorage.removeItem("sms_user");
    setLoading(true);
    setError("");
    try {
      const config = await api<{ demo: boolean }>("/config");
      setDemo(config.demo);
      const u = await api<User>("/auth/me");
      await loadData();
      setUser(u);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401))
        setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void initialize();
  }, [initialize]);
  useEffect(() => {
    const expire = () => {
      setUser(null);
      clearData();
    };
    window.addEventListener("hub-session-expired", expire);
    // Revalidate on focus and periodically so revoked/expired sessions cannot linger.
    const check = () => {
      if (user)
        api("/auth/me").catch((e) => {
          if (e instanceof ApiError && e.status === 401) expire();
        });
    };
    window.addEventListener("focus", check);
    const timer = setInterval(check, 60000);
    return () => {
      window.removeEventListener("hub-session-expired", expire);
      window.removeEventListener("focus", check);
      clearInterval(timer);
    };
  }, [user]);
  const login = useCallback(async (username: string, password: string) => {
    clearData();
    const u = await api<User>("/auth/login", "POST", { username, password });
    await loadData();
    setUser(u);
    return u;
  }, []);
  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", "POST", {});
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) throw e;
    }
    setUser(null);
    clearData();
  }, []);
  if (loading || error)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <GraduationCap className="size-10 mx-auto text-primary" />
          <h1 className="text-xl font-semibold">Student Hub</h1>
          {loading ? (
            <p className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading your workspace…
            </p>
          ) : (
            <>
              <p role="alert" className="text-muted-foreground">
                {error}
              </p>
              <Button onClick={initialize}>Try again</Button>
            </>
          )}
        </div>
      </div>
    );
  return (
    <AuthContext.Provider value={{ user, demo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth requires AuthProvider");
  return context;
}
