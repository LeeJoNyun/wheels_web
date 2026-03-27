import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { ListingForm } from "@/components/listings/ListingForm";

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login?next=/listings/new");
  }
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-brand-charcoal mb-6">매물 등록</h1>
        <ListingForm />
      </main>
    </div>
  );
}
