import GarageShowcase from "@/components/garage/GarageShowcase";
import { SHOWCASE } from "@/content/showcase";

// Server component: the catalogue JSON stays on the server and only the ~118
// slim showcase entries cross into the client bundle.
export default function Home() {
  return (
    <>
      {/* Warm up the Sketchfab connections early (React 19 hoists these to
          <head>) — shaves connection setup off the first embed load. */}
      <link rel="preconnect" href="https://sketchfab.com" />
      <link rel="preconnect" href="https://static.sketchfab.com" />
      <link rel="preconnect" href="https://media.sketchfab.com" crossOrigin="" />
      <main className="h-dvh w-full overflow-hidden">
        <GarageShowcase cars={SHOWCASE} />
      </main>
    </>
  );
}
