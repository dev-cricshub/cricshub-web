import { redirect } from "next/navigation";

// Public entry point used by the landing site. /dashboard is protected, so signed-out
// visitors are sent to /login and land on the app home after signing in.
export default function ExplorePage() {
  redirect("/dashboard");
}
