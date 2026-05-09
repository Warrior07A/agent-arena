import { Home } from "@/components/home";
import { Landing } from "@/components/landing";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // if (!session?.user) {
  //   return <Landing />;
  // }
  
  return <Home />;
}