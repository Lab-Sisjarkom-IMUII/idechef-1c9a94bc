import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { z } from "zod";

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const translations = {
    id: {
      title: "Ide.Chef",
      subtitle: "Buat akun baru",
      email: "Email",
      emailPlaceholder: "nama@email.com",
      password: "Password",
      passwordPlaceholder: "••••••••",
      registerButton: "Daftar Akun",
      processingButton: "Memproses...",
      or: "Atau daftar dengan",
      googleButton: "Daftar dengan Google",
      hasAccount: "Sudah punya akun? ",
      loginLink: "Login di sini",
      invalidEmail: "Email tidak valid",
      passwordMin: "Password minimal 6 karakter",
      registerFailed: "Registrasi Gagal",
      emailExists: "Email sudah terdaftar, silakan login",
      registerSuccess: "Registrasi Berhasil",
      accountCreated: "Akun berhasil dibuat, silakan masuk",
      error: "Error",
      tryAgain: "Terjadi kesalahan, silakan coba lagi",
      googleError: "Terjadi kesalahan saat mendaftar dengan Google"
    },
    en: {
      title: "Ide.Chef",
      subtitle: "Create new account",
      email: "Email",
      emailPlaceholder: "name@email.com",
      password: "Password",
      passwordPlaceholder: "••••••••",
      registerButton: "Create Account",
      processingButton: "Processing...",
      or: "Or register with",
      googleButton: "Register with Google",
      hasAccount: "Already have an account? ",
      loginLink: "Login here",
      invalidEmail: "Invalid email",
      passwordMin: "Password must be at least 6 characters",
      registerFailed: "Registration Failed",
      emailExists: "Email already registered, please login",
      registerSuccess: "Registration Successful",
      accountCreated: "Account created successfully, please sign in",
      error: "Error",
      tryAgain: "An error occurred, please try again",
      googleError: "An error occurred while registering with Google"
    }
  };

  const t = translations[language];

  const registerSchema = z.object({
    email: z.string().trim().email({ message: t.invalidEmail }),
    password: z.string().min(6, { message: t.passwordMin }),
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/app");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/app");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = registerSchema.safeParse({ email, password });
      
      if (!validation.success) {
        toast({
          title: t.error,
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: t.registerFailed,
            description: t.emailExists,
            variant: "destructive",
          });
        } else {
          toast({
            title: t.registerFailed,
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t.registerSuccess,
          description: t.accountCreated,
        });
        navigate("/app");
      }
    } catch (error) {
      toast({
        title: t.error,
        description: t.tryAgain,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      });

      if (error) {
        toast({
          title: t.registerFailed,
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t.error,
        description: t.googleError,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-lg p-8 space-y-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.processingButton : t.registerButton}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t.or}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleRegister}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t.googleButton}
          </Button>

          <div className="text-center text-sm mt-6">
            <span className="text-muted-foreground">{t.hasAccount}</span>
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="text-primary hover:underline font-medium"
            >
              {t.loginLink}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
