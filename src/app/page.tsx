import { redirect } from "next/navigation";
import { DEFAULT_DEAL } from "@/lib/defaults";

export default function Home() {
  redirect(`/deals/${DEFAULT_DEAL.id}`);
}
