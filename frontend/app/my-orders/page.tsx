import { redirect } from "next/navigation";

export default function MyOrdersRedirectPage() {
  redirect("/account#my-orders");
}
