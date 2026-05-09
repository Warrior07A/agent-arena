import { Home } from "@/components/home";
import { Landing } from "@/components/landing";
import Landing2  from "@/components/ui/landing2";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    // return <Landing/>
    return <Landing2 />;
  }

  return <Home />;
}