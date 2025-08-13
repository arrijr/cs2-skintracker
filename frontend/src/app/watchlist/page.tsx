import dynamic from "next/dynamic";

// Client-Komponente lazy laden (kein SSR nötig)
const WatchlistPage = dynamic(() => import("../components/WatchlistPage"), {
  ssr: false,
});

export default function Page() {
  return <WatchlistPage />;
}
