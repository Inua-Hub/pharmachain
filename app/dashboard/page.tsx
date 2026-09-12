"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  React.useEffect(() => {
    const savedUser = localStorage.getItem("pharma_current");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        const role = user.role;

        if (role === "admin") router.push("/dashboard/admin");
        else if (role === "tmda") router.push("/dashboard/tmda");
        else if (role === "msd") router.push("/dashboard/msd");
        else if (role === "manufacturer") router.push("/dashboard/manufacturer");
        else if (role === "distributor") router.push("/dashboard/distributor");
        else if (role === "pharmacy") router.push("/dashboard/pharmacy");
        else router.push("/");
      } catch (e) {
        console.error(e);
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}