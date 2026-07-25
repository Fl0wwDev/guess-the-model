// The museum is a LIGHT world (the landing garage stays dark). Sketchfab renders
// models on a light studio background, so a light page makes them blend
// seamlessly instead of clashing on black. Vecarz-style editorial.
export default function MuseumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Warm up the Sketchfab connections early (React 19 hoists these to
          <head>) — shaves connection setup off the first embed load. */}
      <link rel="preconnect" href="https://sketchfab.com" />
      <link rel="preconnect" href="https://static.sketchfab.com" />
      <link rel="preconnect" href="https://media.sketchfab.com" crossOrigin="" />
      <div className="min-h-dvh bg-[#f4f2ef] text-neutral-900">{children}</div>
    </>
  );
}
