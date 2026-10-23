import { ImageResponse } from "next/og";

// App icons, drawn here so there are no binary files to maintain.
// "maskable" icons are full-bleed with the mark kept inside the safe zone,
// because phones crop them into circles and rounded squares.
const NAMES = ["180", "192", "512", "maskable-192", "maskable-512"];

export function generateStaticParams() {
  return NAMES.map((name) => ({ name }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!NAMES.includes(name)) return new Response("Not found", { status: 404 });
  const maskable = name.startsWith("maskable");
  const size = Number(name.replace("maskable-", ""));
  const mark = size * (maskable ? 0.5 : 0.62);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#dcff3a",
          borderRadius: maskable ? 0 : size * 0.22,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: mark,
            fontWeight: 800,
            color: "#0e0e0c",
            lineHeight: 1,
            letterSpacing: -mark * 0.04,
          }}
        >
          W
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
