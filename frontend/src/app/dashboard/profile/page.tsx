import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    select: { name: true, email: true, image: true, passwordHash: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information and password.
        </p>
      </div>

      <Card className="rounded-2xl border-border/80 p-6">
        <h2 className="mb-5 font-heading text-base font-semibold">Personal Information</h2>
        <ProfileForm
          defaultValues={{
            name: user.name ?? "",
            image: user.image ?? "",
            email: user.email,
          }}
        />
      </Card>

      {user.passwordHash && (
        <Card className="rounded-2xl border-border/80 p-6">
          <h2 className="mb-1 font-heading text-base font-semibold">Change Password</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Choose a strong password you don&apos;t use anywhere else.
          </p>
          <Separator className="mb-5" />
          <ChangePasswordForm />
        </Card>
      )}
    </div>
  );
}
