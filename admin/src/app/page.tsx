import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <p className={styles.eyebrow}>NG E-commerce</p>
        <h1>Panel administrativo</h1>
        <p className={styles.description}>
          Proyecto base listo para las próximas funcionalidades de administración.
        </p>
      </main>
    </div>
  );
}
