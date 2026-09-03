import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin — Tagui32",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-24 sm:px-6 sm:py-32">
      <h1 className="font-heading text-3xl tracking-wide text-foreground">
        TAGUI<span className="text-primary">32</span> — Admin
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Panel privado del fotógrafo.
      </p>
      <div className="mt-10">
        <LoginForm />
      </div>
    </div>
  );
}
