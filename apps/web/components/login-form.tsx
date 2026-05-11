"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/app",
      });
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authClient.signIn.email({
        email,
        password,
        callbackURL: "/app",
        fetchOptions: {
          onError: (ctx) => {
            toast.error(ctx.error.message);
            setLoading(false);
          },
        },
      });
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authClient.signUp.email({
        email,
        password,
        name: name || email.split("@")[0],
        callbackURL: "/app",
        fetchOptions: {
          onError: (ctx) => {
            toast.error(ctx.error.message);
            setLoading(false);
          },
          onSuccess({ response, data }) {
            toast.info(response.statusText);
          },
        },
      });
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-6 border-b border-border pb-4">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`text-2xl tracking-tight uppercase ${
            mode === "signin"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`text-2xl tracking-tight uppercase ${
            mode === "signup"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign Up
        </button>
      </div>

      <p className="text-[11px] tracking-[0.2em] mb-6 text-muted-foreground uppercase">
        {mode === "signin"
          ? "Enter your credentials to access the arena"
          : "Create an account to start betting"}
      </p>

      <form
        onSubmit={mode === "signin" ? handleEmailSignIn : handleEmailSignUp}
        className="flex flex-col gap-4"
      >
        {mode === "signup" && (
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="auth-name"
              className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase"
            >
              Name
            </Label>
            <Input
              id="auth-name"
              type="text"
              placeholder="Your name"
              className="h-10 rounded-none border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="auth-email"
            className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase"
          >
            Email
          </Label>
          <Input
            id="auth-email"
            type="email"
            placeholder="you@example.com"
            required
            className="h-10 rounded-none border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="auth-password"
            className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase"
          >
            Password
          </Label>
          <Input
            id="auth-password"
            type="password"
            placeholder="••••••••"
            required
            className="h-10 rounded-none border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="text-[11px] tracking-[0.2em] mt-2 h-10 w-full bg-primary text-primary-foreground uppercase hover:bg-primary/90"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div
                className="size-4 animate-spin border-2 border-primary-foreground/30 border-t-primary-foreground"
                style={{ borderRadius: "50%" }}
              />
              {mode === "signin" ? "SIGNING IN..." : "CREATING..."}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
            </span>
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <Separator className="bg-border" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] tracking-[0.2em] bg-background px-3 text-muted-foreground uppercase">
            OR CONTINUE WITH
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => handleOAuth("google")}
          disabled={loading}
          className="text-[11px] tracking-[0.2em] h-10 rounded-none border-border bg-transparent text-muted-foreground uppercase hover:bg-secondary hover:text-foreground"
        >
          <svg className="mr-2 size-4" viewBox="0 0 488 512">
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            />
          </svg>
          Google
        </Button>
        <Button
          variant="outline"
          onClick={() => handleOAuth("github")}
          disabled={loading}
          className="text-[11px] tracking-[0.2em] h-10 rounded-none border-border bg-transparent text-muted-foreground uppercase hover:bg-secondary hover:text-foreground"
        >
          <svg className="mr-2 size-4" viewBox="0 0 30 30">
            <path
              fill="currentColor"
              d="M15,3C8.373,3,3,8.373,3,15c0,5.623,3.872,10.328,9.092,11.63C12.036,26.468,12,26.28,12,26.047v-2.051 c-0.487,0-1.303,0-1.508,0c-0.821,0-1.551-0.353-1.905-1.009c-0.393-0.729-0.461-1.844-1.435-2.526 c-0.289-0.227-0.069-0.486,0.264-0.451c0.615,0.174,1.125,0.596,1.605,1.222c0.478,0.627,0.703,0.769,1.596,0.769 c0.433,0,1.081-0.025,1.691-0.121c0.328-0.833,0.895-1.6,1.588-1.962c-3.996-0.411-5.903-2.399-5.903-5.098 c0-1.162,0.495-2.286,1.336-3.233C9.053,10.647,8.706,8.73,9.435,8c1.798,0,2.885,1.166,3.146,1.481C13.477,9.174,14.461,9,15.495,9 c1.036,0,2.024,0.174,2.922,0.483C18.675,9.17,19.763,8,21.565,8c0.732,0.731,0.381,2.656,0.102,3.594 c0.836,0.945,1.328,2.066,1.328,3.226c0,2.697-1.904,4.684-5.894,5.097C18.199,20.49,19,22.1,19,23.313v2.734 c0,0.104-0.023,0.179-0.035,0.268C23.641,24.676,27,20.236,27,15C27,8.373,21.627,3,15,3z"
            />
          </svg>
          GitHub
        </Button>
      </div>
    </>
  );
}
