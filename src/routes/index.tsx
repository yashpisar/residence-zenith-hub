import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const token = localStorage.getItem("havenly.token");
    const userString = localStorage.getItem("havenly.user");
    const societyId = localStorage.getItem("havenly.societyId");
    
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
