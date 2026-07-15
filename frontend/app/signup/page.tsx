import { redirect } from "next/navigation";

type SignupPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const nextValue = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextQuery = nextValue ? `&next=${encodeURIComponent(nextValue)}` : "";

  redirect(`/login?mode=signup${nextQuery}`);
}
