import PartidaDetailClient from "./PartidaDetailClient";

export default function PartidaDetailPage({ params }: { params: { id: string } }) {
  return <PartidaDetailClient params={params} />;
}
