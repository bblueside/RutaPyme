// Cabecera de cada vista: título y frase a la izquierda, un dato `meta` a la derecha.
import type { ReactNode } from 'react'
import styles from './ViewHeader.module.css'

interface ViewHeaderProps {
  title: string
  description: string
  meta?: ReactNode
}

function ViewHeader({ title, description, meta }: ViewHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
      {meta && <div className={styles.meta}>{meta}</div>}
    </header>
  )
}

export default ViewHeader
