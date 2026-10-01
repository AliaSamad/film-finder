import { Suspense } from "react";
import { Discover } from "@/components/Discover";
import { PageLoading } from "@/components/ui";

export default function DiscoverPage() {
  // useSearchParams (inside Discover) needs a Suspense boundary.
  return (
    <Suspense fallback={<PageLoading />}>
      <Discover />
    </Suspense>
  );
}
