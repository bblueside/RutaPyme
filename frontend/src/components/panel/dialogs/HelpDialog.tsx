// "Ayuda y cómo funciona": textos fijos que explican la red, los algoritmos y la tarifa.
import Modal from '../shared/Modal'

function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} title="Ayuda y cómo funciona" subtitle="Lo esencial para leer tu red de entregas." onClose={onClose} size="lg">
      <dl className="pn-help">
        <dt>Lugares y trayectos</dt>
        <dd>
          Un <strong>lugar</strong> es una bodega, un barrio o un punto de recogida. Un <strong>trayecto</strong> es un
          camino de un solo sentido entre dos lugares, con el tiempo estimado en minutos. Ir de A a B no significa poder
          volver: cada dirección se registra por separado.
        </dd>
        <dt>Cobertura</dt>
        <dd>
          Responde «¿hasta dónde puedo llegar desde este origen?». Se calcula con un recorrido por capas (BFS): primero
          los lugares a un trayecto, luego a dos, y así. Los que no aparecen no tienen forma de llegar desde el origen.
        </dd>
        <dt>Ruta más rápida</dt>
        <dd>
          Se calcula con el algoritmo de Dijkstra y suma los minutos de cada tramo. Se compara con la ruta de menos
          tramos para mostrar que menos saltos no siempre significa menos tiempo.
        </dd>
        <dt>Costo en pesos</dt>
        <dd>
          Los minutos de la ruta se multiplican por una tarifa fija por minuto que define el servidor (la ves junto al
          resultado). Es una tarifa ficticia: los datos son inventados y no hay mapas ni GPS.
        </dd>
        <dt>Datos en memoria</dt>
        <dd>La red vive solo en el servidor mientras está encendido: al reiniciarlo vuelve a empezar vacía.</dd>
      </dl>
    </Modal>
  )
}

export default HelpDialog
