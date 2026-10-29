import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioCanvas } from "@/components/three/StudioCanvas";
import { getShot } from "@/lib/three/shots";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Development-only route used to regenerate the concept images in
 * public/images/concepts. It returns 404 in production builds.
 */
export default async function StudioPage({ params }: { params: Promise<{ shot: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { shot } = await params;
  if (!getShot(shot)) notFound();
  return <StudioCanvas shotId={shot} />;
}
