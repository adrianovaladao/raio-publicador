import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const user = await currentUser();
  if (user?.publicMetadata?.raioAdmin === true) {
    redirect("/admin");
  }
  return <DashboardClient />;
}
