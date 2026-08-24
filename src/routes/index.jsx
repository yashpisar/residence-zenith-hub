import { createFileRoute, redirect } from "@tanstack/react-router";
import { storage } from "@/lib/storage";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const token = storage.getItem("havenly.token");
    const userString = storage.getItem("havenly.user");
    const societyId = storage.getItem("havenly.societyId");
    if (token && userString && societyId) {
      try {
        const user = JSON.parse(userString);
        if (user && user.role) {
          const pathPrefix = user.role === "security" ? "guard" : user.role;
          throw redirect({ to: `/${pathPrefix}/dashboard` });
        }
      } catch (e) {
        // Fallthrough if parsing fails
      }
    }
    // Not authenticated or no valid society selected, redirect to society selection
    throw redirect({ to: "/select-society" });
  },
  component: () => null,
});
