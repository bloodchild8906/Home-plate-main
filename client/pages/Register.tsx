import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useBranding } from "@/lib/branding";
import { cn } from "@/lib/utils";
import type { ApiResponse, LoginBuilderBlockId, User } from "@shared/api";

const REGISTER_FEATURES: Array<{ icon: ReactNode; title: string; description: string }> = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Companion-ready onboarding",
    description: "Create credentials that can be used across platform modules.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Role-aware defaults",
    description: "New accounts start with restricted defaults and can be promoted later.",
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Secure credentials",
    description: "Passwords are stored securely and validated before activation.",
  },
];

export default function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, signIn, isReady } = useAuth();
  const { brand } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();
  const builder = brand.registerBuilder;

  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";

  useEffect(() => {
    if (isReady && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isReady, navigate, redirectTo]);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
      });
      const payload = (await response.json()) as ApiResponse<User>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "Unable to create account.");
      }

      await signIn(username, password);
      toast.success("Account created.");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  const featureGridClass =
    builder.featureColumns === 1
      ? "sm:grid-cols-1"
      : builder.featureColumns === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-3";

  const renderBlock = (blockId: LoginBuilderBlockId) => {
    switch (blockId) {
      case "badge":
        return (
          <Badge className="rounded-full bg-white text-slate-950">
            {brand.name} Account Registration
          </Badge>
        );
      case "brand":
        return (
          <BrandMark
            image={brand.logoImage}
            text={brand.logo}
            label={`${brand.name} logo`}
            primary={brand.primary}
            accent={brand.accent}
            className="h-16 w-16 rounded-3xl"
            imageClassName="object-contain bg-white p-2.5"
          />
        );
      case "headline":
        return (
          <h1 className="max-w-xl text-4xl font-black tracking-tight sm:text-5xl">
            Create your workspace account and start building.
          </h1>
        );
      case "description":
        return (
          <p className="max-w-2xl text-base text-slate-200">
            Register with a secure password. Your role starts in a limited state until access
            is approved.
          </p>
        );
      case "featureTiles":
        return (
          <div className={cn("grid gap-4", featureGridClass)}>
            {REGISTER_FEATURES.map((feature) => (
              <FeatureTile
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        );
      case "loginTitle":
        return <h2 className="text-2xl font-black text-white">Create account</h2>;
      case "loginHint":
        return (
          <p className="text-sm text-slate-300">
            Register a new user for this workspace, then continue into the platform.
          </p>
        );
      case "registerForm":
        return (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300">Full name</Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                placeholder="Jane Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300">Username</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-11 rounded-2xl border-white/10 bg-white/5 pl-10 text-white"
                  placeholder="newuser"
                  autoComplete="username"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                placeholder="you@domain.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 rounded-2xl border-white/10 bg-white/5 pl-10 text-white"
                  placeholder="Create password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300">Confirm password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
                placeholder="Repeat password"
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="h-12 w-full rounded-2xl text-base font-bold" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        );
      case "loginForm":
        return (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            Login form is not available on the register page. Use the login page builder.
          </div>
        );
      case "demoAccounts":
        return (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Demo account chips are disabled for register mode.
          </div>
        );
      case "footer":
        return (
          <p className="text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-slate-100 underline underline-offset-4">
              Sign in
            </Link>
          </p>
        );
      default:
        return null;
    }
  };

  return <AuthPageFrame brand={brand} builder={builder} renderBlock={renderBlock} />;
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
      <p className="mt-1 text-sm text-slate-300">{description}</p>
    </div>
  );
}
