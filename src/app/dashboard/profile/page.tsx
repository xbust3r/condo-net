"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, User, Mail, Building2 } from "lucide-react";

export default function ProfilePage() {
  const tp = useTranslations("profile");
  const tn = useTranslations("nav");
  const { user, selectedCondominium, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-4 pb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-5/10 text-chart-5">
          <User className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{tn("profile")}</h2>
      </div>

      {/* Avatar + Name */}
      <Card>
        <CardContent className="p-6 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            {user.profile?.avatar_url ? (
              <img
                src={user.profile.avatar_url}
                alt="Avatar"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-10 w-10" />
            )}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">
              {user.profile?.first_name
                ? `${user.profile.first_name} ${user.profile.last_name || ""}`
                : user.name || tp("user")}
            </h3>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase">{tp("email")}</p>
              <p className="text-sm text-foreground">{user.email}</p>
            </div>
          </div>
          {selectedCondominium?.id && (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase">
                  {tp("currentCondo")}
                </p>
                <p className="text-sm text-foreground">
                  {selectedCondominium.name}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles */}
      {user.roles_by_condominium && selectedCondominium?.id && (
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground/60 uppercase mb-2">
              {tp("roles")}
            </p>
            <div className="flex flex-wrap gap-2">
              {(user.roles_by_condominium[selectedCondominium.id] || []).map(
                (role: any) => (
                  <span
                    key={role.id}
                    className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary font-medium"
                  >
                    {role.name || role.role}
                  </span>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
