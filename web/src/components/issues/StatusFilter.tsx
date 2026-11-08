"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "../ui/Button";

const STATUSES = ["todo", "in_progress", "review", "done"];

export function StatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status");

  function setStatus(status: string | null) {
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button active={!currentStatus} onClick={() => setStatus(null)}>
        All
      </Button>
      {STATUSES.map((status) => (
        <Button
          key={status}
          active={currentStatus === status}
          onClick={() => setStatus(status)}
        >
          {status.replace("_", " ")}
        </Button>
      ))}
    </div>
  );
}
