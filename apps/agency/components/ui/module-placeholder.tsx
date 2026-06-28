import styles from "./module-placeholder.module.css";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  epic?: string;
}

export function ModulePlaceholder({
  title,
  description,
  epic = "Epic 2+",
}: ModulePlaceholderProps) {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </header>
      <div className={styles.placeholder}>
        <p className={styles.message}>
          Module shell ready. Implementation ships in {epic}.
        </p>
      </div>
    </div>
  );
}
