import PresupuestoProyectoClient from "./PresupuestoProyectoClient";

export default function PresupuestoProyectoPage({
  params
}: {
  params: { proyectoId: string };
}) {
  return <PresupuestoProyectoClient params={params} />;
}
