import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getUserRoleLabel } from "@/lib/access-control";
import { demoCredentials, useAuth } from "@/lib/auth";
import { useBranding } from "@/lib/branding";

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123!");
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, signIn, isReady } = useAuth();
  const { brand } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";

  useEffect(() => {
    if (isReady && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isReady, navigate, redirectTo]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const user = await signIn(username, password);
      toast.success(`Signed in as ${getUserRoleLabel(user)}`);
      navigate(redirectTo, { replace: true });
    } catch {
      toast.error("Invalid credentials. Use one of the demo accounts below.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-10 text-white"
      style={{
        backgroundImage: `radial-gradient(circle at top left, hsl(var(--accent) / 0.22), transparent 28%), radial-gradient(circle at bottom right, hsl(var(--primary) / 0.24), transparent 32%), linear-gradient(145deg, ${brand.secondary}, ${brand.secondary} 52%, ${brand.primary})`,
      }}
    >
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div>
            <Badge className="rounded-full bg-white text-slate-950">{brand.name} Secure Access</Badge>
            <BrandMark
              image={brand.logoImage}
              text={brand.logo}
              label={`${brand.name} logo`}
              primary={brand.primary}
              accent={brand.accent}
              className="mt-8 h-16 w-16 rounded-3xl"
              imageClassName="object-contain bg-white p-2.5"
            />
            <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight sm:text-5xl">
              Restaurant app operations with role-based access from the first screen.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300">
              Use demo credentials to enter the workspace as an administrator, designer, operator, or analyst. Each role exposes a different set of modules and route permissions.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <FeatureTile
              icon={<Sparkles className="h-5 w-5" />}
              title="Builder navigation"
              description="Compose top bars, quick-link menus, and bottom tab rails in the designer."
            />
            <FeatureTile
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Guarded routes"
              description="Modules open only when the signed-in role is authorized."
            />
            <FeatureTile
              icon={<Lock className="h-5 w-5" />}
              title="Demo policy matrix"
              description="Access control stays synchronized with the route definitions."
            />
          </div>
        </section>

        <section className="flex items-center">
          <Card className="w-full overflow-hidden rounded-[2rem] border-white/10 bg-slate-950/70 shadow-2xl backdrop-blur-xl">
            <CardHeader className="border-b border-white/10 pb-6">
              <CardTitle className="text-2xl font-black text-white">Sign in to the workspace</CardTitle>
              <p className="text-sm text-slate-400">
                Protected routes redirect here automatically. Credentials below are preloaded for testing.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 p-6 sm:p-8">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                    Username
                  </Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pl-10 text-white"
                      placeholder="admin"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pl-10 text-white"
                      placeholder="admin123!"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button type="submit" className="h-12 w-full rounded-2xl text-base font-bold" disabled={isLoading}>
                  {isLoading ? "Signing in..." : `Enter ${brand.name}`}
                </Button>
              </form>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                  Demo accounts
                </div>
                <div className="grid gap-3">
                  {demoCredentials.map((account) => (
                    <button
                      key={account.username}
                      type="button"
                      onClick={() => {
                        setUsername(account.username);
                        setPassword(account.password);
                      }}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition-colors hover:border-white/20 hover:bg-black/30"
                    >
                      <div>
                        <div className="font-bold text-white">{getUserRoleLabel(account.user)}</div>
                        <div className="text-xs text-slate-400">
                          {account.username} / {account.password}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-white/20 text-slate-300">
                        {account.user.role}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-center text-xs text-slate-500">
                Returning to <span className="text-slate-300">{redirectTo}</span>.{" "}
                <Link to="/" className="text-slate-300 underline underline-offset-4">
                  Dashboard
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function FeatureTile({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
        {icon}
      </div>
      <div className="font-bold text-white">{title}</div>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>
  );
}
